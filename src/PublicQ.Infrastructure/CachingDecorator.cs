using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;

namespace PublicQ.Infrastructure;

/// <summary>
/// Caching decorator using DispatchProxy.
/// AOP style caching for services.
/// Methods to be cached should be marked with [Cacheable] attribute.
/// </summary>
/// <typeparam name="TService"></typeparam>
public class CachingDecorator<TService> : DispatchProxy 
    where TService : class
{
    private TService target = null!;
    private ICacheService cacheService = null!;
    private IOptionsMonitor<RedisOptions> redisOptions = null!;
    private ILogger<CachingDecorator<TService>> logger = null!;
    
    /// <inheritdoc cref="DispatchProxy.Invoke"/>
    protected override object? Invoke(MethodInfo? targetMethod, object?[]? args)
    {
        if (targetMethod == null)
        {
            return null;
        }
        
        var cacheAttribute = targetMethod.GetCustomAttribute<CacheableAttribute>();
        if (cacheAttribute?.BypassCache == true || cacheAttribute is null)
        {
            return targetMethod.Invoke(target, args);
        }
        
        if (IsAsyncMethod(targetMethod))
        {
            return InvokeAsync(targetMethod, args, cacheAttribute);
        }

        // Handle sync methods (execute directly for now)
        return targetMethod.Invoke(target, args);
    }

    private object InvokeAsync(MethodInfo targetMethod, object?[]? args, CacheableAttribute cacheAttribute)
    {
        // Check if caching is enabled
        if (!redisOptions.CurrentValue.Enabled)
        {
            return targetMethod.Invoke(target, args)!;
        }

        var returnType = GetAsyncReturnType(targetMethod);
        if (returnType == null)
        {
            return targetMethod.Invoke(target, args)!;
        }

        // Use reflection to call the generic method
        var genericMethod = typeof(CachingDecorator<TService>)
            .GetMethod(nameof(InvokeAsyncGeneric), BindingFlags.NonPublic | BindingFlags.Instance)!
            .MakeGenericMethod(returnType);

        return genericMethod.Invoke(this, [targetMethod, args, cacheAttribute])!;
    }

    private async Task<T> InvokeAsyncGeneric<T>(MethodInfo targetMethod, object?[]? args, CacheableAttribute cacheAttribute) where T : class
    {
        var cacheKey = GenerateCacheKey(targetMethod, args, cacheAttribute);
        var cacheDuration = GetCacheDuration(targetMethod);

        try
        {
            // Try to get from cache first
            var cacheResponse = await cacheService.GetAsync<T>(cacheKey);
            if (cacheResponse.Status == GenericOperationStatuses.Completed && cacheResponse.Data != null)
            {
                logger.LogDebug("Cache hit for {Method} with key: {Key}", targetMethod.Name, cacheKey);
                return cacheResponse.Data;
            }

            // Execute original method
            var methodResult = targetMethod.Invoke(target, args);
            if (methodResult is Task<T> task)
            {
                var result = await task;
                
                // Cache the result
                await cacheService.SetAsync(cacheKey, result, cacheDuration);
                
                logger.LogDebug("Cached result for {Method} with key: {Key}, duration: {Duration}", 
                    targetMethod.Name, cacheKey, cacheDuration);
                
                return result;
            }

            throw new InvalidOperationException($"Expected Task<{typeof(T).Name}> return type for method {targetMethod.Name}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in caching decorator for method: {Method}", targetMethod.Name);
            
            // Fallback to original method
            var fallbackResult = targetMethod.Invoke(target, args);
            if (fallbackResult is Task<T> fallbackTask)
            {
                return await fallbackTask;
            }
            throw;
        }
    }

    private static Type? GetAsyncReturnType(MethodInfo method)
    {
        if (method.ReturnType.IsGenericType && method.ReturnType.GetGenericTypeDefinition() == typeof(Task<>))
        {
            return method.ReturnType.GetGenericArguments()[0];
        }
        return null;
    }
    
    private bool IsAsyncMethod(MethodInfo targetMethod)
    {
        return targetMethod.GetCustomAttribute<AsyncStateMachineAttribute>() != null ||
               targetMethod.ReturnType.IsGenericType && targetMethod.ReturnType.GetGenericTypeDefinition() == typeof(Task<>) ||
               targetMethod.ReturnType == typeof(Task);
    }
    
    private static object? GetTaskResult(Task task)
    {
        if (task.GetType().IsGenericType)
        {
            var property = task.GetType().GetProperty("Result");
            return property?.GetValue(task);
        }
        return null;
    }
    
    private string GenerateCacheKey(MethodInfo method, object?[]? args, CacheableAttribute cacheAttribute)
    {
        if (!string.IsNullOrEmpty(cacheAttribute.CustomKey))
        {
            return cacheAttribute.CustomKey;
        }

        var keyBuilder = new StringBuilder();
        keyBuilder.Append($"{typeof(TService).Name}:{method.Name}");

        if (args != null && args.Length > 0)
        {
            for (int i = 0; i < args.Length; i++)
            {
                var arg = args[i];
                
                // Skip CancellationToken parameters as they shouldn't affect cache keys
                // Because they are not part of the method's logical input and can vary per call
                if (arg is CancellationToken)
                {
                    continue;
                }
                
                if (arg != null)
                {
                    var argValue = arg is string || arg.GetType().IsPrimitive 
                        ? arg.ToString() 
                        : arg.GetHashCode().ToString();
                    keyBuilder.Append($":{argValue}");
                }
                else
                {
                    keyBuilder.Append(":null");
                }
            }
        }

        return keyBuilder.ToString();
    }
    
    private TimeSpan GetCacheDuration(MethodInfo method)
    {
        var cacheConfig = redisOptions.CurrentValue;
        var serviceName = typeof(TService).Name;
        var methodName = method.Name;
        
        return cacheConfig.GetCacheDuration(serviceName, methodName);
    }
    
    public static TService Create(
        TService target, 
        ICacheService cacheService, 
        IOptionsMonitor<RedisOptions> redisOptions,
        ILogger<CachingDecorator<TService>> logger)
    {
        var proxy = Create<TService, CachingDecorator<TService>>() as CachingDecorator<TService>;
        proxy!.target = target;
        proxy.cacheService = cacheService;
        proxy.redisOptions = redisOptions;
        proxy.logger = logger;
        return (proxy as TService)!;
    }
}