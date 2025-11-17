using PublicQ.Application.Models.Group;

namespace PublicQ.Application.Models.Session;

/// <summary>
/// GroupMemberStatesWithUserProgressDto extends GroupMemberDto by adding a Status property to represent
/// Question and Answer count are based on the user progress
/// <seealso cref="GroupMemberDto"/>
/// </summary>
public class GroupMemberStateWithUserProgressDto : GroupMemberDto
{
    /// <summary>
    /// Member's current module status.
    /// <seealso cref="ModuleStatus"/>
    /// </summary>
    public ModuleStatus Status { get; set; }
    
    /// <summary>
    /// The number of questions in the module.
    /// </summary>
    public int QuestionCount { get; set; }
    
    /// <summary>
    /// Answered question count.
    /// </summary>
    public int AnswerCount { get; set; }
}