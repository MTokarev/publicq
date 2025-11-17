namespace PublicQ.Shared;

/// <summary>
/// Html content for message templates.
/// </summary>
public static class MessageTemplateHtmlContent
{
  /// <summary>
  /// Message body for the welcome email.
  /// </summary>
  public const string WelcomeEmailBody = """
                                         <!DOCTYPE html>
                                         <html lang="en" style="margin:0;padding:0;">
                                           <head>
                                             <meta charset="utf-8" />
                                             <meta name="viewport" content="width=device-width,initial-scale=1" />
                                             <meta name="x-apple-disable-message-reformatting" />
                                             <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
                                             <meta name="color-scheme" content="light dark" />
                                             <meta name="supported-color-schemes" content="light dark" />
                                             <title>Welcome to PublicQ</title>
                                             <style>
                                               body {
                                                 margin:0;
                                                 padding:0;
                                                 background:linear-gradient(135deg,#e6f0ff,#f9fbff);
                                                 font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
                                                 color:#1e2330;
                                               }
                                               .container {
                                                 max-width:800px;
                                                 margin:0 auto;
                                                 padding:32px 20px;
                                               }
                                               .card {
                                                 background:rgba(255,255,255,0.85);
                                                 border-radius:16px;
                                                 padding:32px;
                                                 box-shadow:0 8px 20px rgba(0,0,0,0.1);
                                               }
                                               h1 {
                                                 margin:0 0 20px 0;
                                                 font-size:24px;
                                                 font-weight:600;
                                                 color:#0b5fff;
                                                 text-align:center;
                                               }
                                               p {
                                                 margin:0 0 16px 0;
                                                 font-size:16px;
                                                 line-height:1.6;
                                               }
                                               .footer {
                                                 margin-top:28px;
                                                 font-size:12px;
                                                 color:#6b7280;
                                                 text-align:center;
                                               }
                                               @media (max-width:600px) {
                                                 .card { padding:20px; }
                                                 h1 { font-size:20px; }
                                                 p { font-size:15px; }
                                               }
                                               @media (prefers-color-scheme: dark) {
                                                 body {
                                                   background:linear-gradient(135deg,#0f1115,#1b1e24);
                                                   color:#e7e7ea;
                                                 }
                                                 .card {
                                                   background:rgba(30,33,40,0.85);
                                                   border:1px solid #2a2f3a;
                                                 }
                                                 h1 { color:#7cb8ff; }
                                                 .footer { color:#a7acb8; }
                                               }
                                             </style>
                                           </head>
                                           <body>
                                             <div class="container">
                                               <div class="card">
                                                 <h1>Welcome to PublicQ</h1>
                                                 <p>Hello <strong>{{User}}</strong>,</p>
                                                 <p>
                                                   Thank you for joining <span style="color:#0b5fff;font-weight:600;">PublicQ</span>!  
                                                   We are excited to have you on board.
                                                 </p>
                                                 <p>Best regards,<br/>PublicQ Team</p>
                                                 <div class="footer">
                                                   If you did not create a PublicQ account, you can safely ignore this message.
                                                 </div>
                                               </div>
                                             </div>
                                           </body>
                                         </html>
                                         """;

  /// <summary>
  /// Message body for the welcome email.
  /// </summary>
  public const string WelcomeEmailBodyWithResetLink = """
                                                      <!DOCTYPE html>
                                                      <html lang="en" style="margin:0;padding:0;">
                                                        <head>
                                                          <meta charset="utf-8" />
                                                          <meta name="viewport" content="width=device-width,initial-scale=1" />
                                                          <meta name="x-apple-disable-message-reformatting" />
                                                          <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
                                                          <meta name="color-scheme" content="light dark" />
                                                          <meta name="supported-color-schemes" content="light dark" />
                                                          <title>Welcome to PublicQ</title>
                                                          <style>
                                                            body {
                                                              margin:0;
                                                              padding:0;
                                                              background:linear-gradient(135deg,#e6f0ff,#f9fbff);
                                                              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
                                                              color:#1e2330;
                                                            }
                                                            .container {
                                                              max-width:800px;
                                                              margin:0 auto;
                                                              padding:32px 20px;
                                                            }
                                                            .card {
                                                              background:rgba(255,255,255,0.85);
                                                              border-radius:16px;
                                                              padding:32px;
                                                              box-shadow:0 8px 20px rgba(0,0,0,0.1);
                                                            }
                                                            h1 {
                                                              margin:0 0 20px 0;
                                                              font-size:24px;
                                                              font-weight:600;
                                                              color:#0b5fff;
                                                              text-align:center;
                                                            }
                                                            p {
                                                              margin:0 0 16px 0;
                                                              font-size:16px;
                                                              line-height:1.6;
                                                            }
                                                            .cta {
                                                              display:block;
                                                              margin:20px auto 10px auto;
                                                              width:max-content;
                                                              text-decoration:none;
                                                              background:#0b5fff;
                                                              color:#ffffff !important;
                                                              padding:12px 20px;
                                                              border-radius:10px;
                                                              font-weight:600;
                                                            }
                                                            .link-fallback {
                                                              background:#f1f4fb;
                                                              border-radius:8px;
                                                              padding:12px 16px;
                                                              margin:12px 0 0 0;
                                                              font-family:monospace;
                                                              font-size:14px;
                                                              color:#0b5fff;
                                                              word-break:break-all;
                                                            }
                                                            .footer {
                                                              margin-top:28px;
                                                              font-size:12px;
                                                              color:#6b7280;
                                                              text-align:center;
                                                            }
                                                            @media (max-width:600px) {
                                                              .card { padding:20px; }
                                                              h1 { font-size:20px; }
                                                              p { font-size:15px; }
                                                            }
                                                            @media (prefers-color-scheme: dark) {
                                                              body {
                                                                background:linear-gradient(135deg,#0f1115,#1b1e24);
                                                                color:#e7e7ea;
                                                              }
                                                              .card {
                                                                background:rgba(30,33,40,0.85);
                                                                border:1px solid #2a2f3a;
                                                              }
                                                              h1 { color:#7cb8ff; }
                                                              .cta { background:#7cb8ff; color:#0f1115 !important; }
                                                              .link-fallback { background:#252b36; color:#7cb8ff; }
                                                              .footer { color:#a7acb8; }
                                                            }
                                                          </style>
                                                        </head>
                                                        <body>
                                                          <div class="container">
                                                            <div class="card">
                                                              <h1>Welcome to PublicQ</h1>
                                                              <p>Hello <strong>{{User}}</strong>,</p>
                                                              <p>
                                                                Your account on <a href="{{BaseUrl}}" target="_blank" rel="noopener" style="color:#0b5fff;font-weight:600;text-decoration:none;">PublicQ</a> has been created successfully.  
                                                                We’re glad to welcome you to the platform.
                                                              </p>
                                                      
                                                              <!-- Primary CTA button -->
                                                              <a class="cta" href="{{CreatePasswordUrl}}" target="_blank" rel="noopener">Create Your Password</a>
                                                      
                                                              <!-- Fallback plain link -->
                                                              <div class="link-fallback">
                                                                {{CreatePasswordUrl}}
                                                              </div>
                                                      
                                                              <p style="margin-top:16px;">If you didn’t sign up for a PublicQ account, you can safely ignore this email.</p>
                                                              <p>Best regards,<br/>PublicQ Team</p>
                                                      
                                                              <div class="footer">
                                                                Your account is ready — let’s get started!
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </body>
                                                      </html>
                                                      """;
  
  public const string ForgetPasswordEmailBody = """
                                                <!DOCTYPE html>
                                                <html lang="en" style="margin:0;padding:0;">
                                                  <head>
                                                    <meta charset="utf-8" />
                                                    <meta name="viewport" content="width=device-width,initial-scale=1" />
                                                    <meta name="x-apple-disable-message-reformatting" />
                                                    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
                                                    <meta name="color-scheme" content="light dark" />
                                                    <meta name="supported-color-schemes" content="light dark" />
                                                    <title>Reset Your Password</title>
                                                    <style>
                                                      body {
                                                        margin:0;
                                                        padding:0;
                                                        background:linear-gradient(135deg,#e6f0ff,#f9fbff);
                                                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
                                                        color:#1e2330;
                                                      }
                                                      .container {
                                                        max-width:800px;
                                                        margin:0 auto;
                                                        padding:32px 20px;
                                                      }
                                                      .card {
                                                        background:rgba(255,255,255,0.85);
                                                        border-radius:16px;
                                                        padding:32px;
                                                        box-shadow:0 8px 20px rgba(0,0,0,0.1);
                                                      }
                                                      h1 {
                                                        margin:0 0 20px 0;
                                                        font-size:24px;
                                                        font-weight:600;
                                                        color:#0b5fff;
                                                        text-align:center;
                                                      }
                                                      p {
                                                        margin:0 0 16px 0;
                                                        font-size:16px;
                                                        line-height:1.6;
                                                      }
                                                      .cta {
                                                        display:block;
                                                        margin:20px auto 10px auto;
                                                        width:max-content;
                                                        text-decoration:none;
                                                        background:#0b5fff;
                                                        color:#ffffff !important;
                                                        padding:12px 20px;
                                                        border-radius:10px;
                                                        font-weight:600;
                                                      }
                                                      .link-fallback {
                                                        background:#f1f4fb;
                                                        border-radius:8px;
                                                        padding:12px 16px;
                                                        margin:12px 0 0 0;
                                                        font-family:monospace;
                                                        font-size:14px;
                                                        color:#0b5fff;
                                                        word-break:break-all;
                                                      }
                                                      .footer {
                                                        margin-top:28px;
                                                        font-size:12px;
                                                        color:#6b7280;
                                                        text-align:center;
                                                      }
                                                      @media (max-width:600px) {
                                                        .card { padding:20px; }
                                                        h1 { font-size:20px; }
                                                        p { font-size:15px; }
                                                      }
                                                      @media (prefers-color-scheme: dark) {
                                                        body {
                                                          background:linear-gradient(135deg,#0f1115,#1b1e24);
                                                          color:#e7e7ea;
                                                        }
                                                        .card {
                                                          background:rgba(30,33,40,0.85);
                                                          border:1px solid #2a2f3a;
                                                        }
                                                        h1 { color:#7cb8ff; }
                                                        .link-fallback {
                                                          background:#252b36;
                                                          color:#7cb8ff;
                                                        }
                                                        .footer { color:#a7acb8; }
                                                      }
                                                    </style>
                                                  </head>
                                                  <body>
                                                    <div class="container">
                                                      <div class="card">
                                                        <h1>Reset Your Password</h1>
                                                        <p>Hello <strong>{{User}}</strong>,</p>
                                                        <p>We received a request to reset your password. Click the button below to create a new one:</p>
                                                
                                                        <!-- Primary CTA uses the reset link -->
                                                        <a class="cta" href="{{ResetLink}}" target="_blank" rel="noopener">Reset Password</a>
                                                
                                                        <!-- Fallback plain link (placed under {{ResetLink}}) -->
                                                        <div class="link-fallback">
                                                          {{ResetLink}}
                                                        </div>
                                                
                                                        <p style="margin-top:16px;">If you didn’t request a password reset, you can safely ignore this email.</p>
                                                        <p>Best regards,<br/>PublicQ Team</p>
                                                
                                                        <div class="footer">
                                                          This link will expire after a short period for security reasons.
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </body>
                                                </html>
                                                """;
  
  public const string PasswordResetEmailBody = """
                                               <!DOCTYPE html>
                                               <html lang="en" style="margin:0;padding:0;">
                                                 <head>
                                                   <meta charset="utf-8" />
                                                   <meta name="viewport" content="width=device-width,initial-scale=1" />
                                                   <meta name="x-apple-disable-message-reformatting" />
                                                   <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
                                                   <meta name="color-scheme" content="light dark" />
                                                   <meta name="supported-color-schemes" content="light dark" />
                                                   <title>Password Reset</title>
                                                   <style>
                                                     body {
                                                       margin:0;
                                                       padding:0;
                                                       background:linear-gradient(135deg,#e6f0ff,#f9fbff);
                                                       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
                                                       color:#1e2330;
                                                     }
                                                     .container {
                                                       max-width:800px;
                                                       margin:0 auto;
                                                       padding:32px 20px;
                                                     }
                                                     .card {
                                                       background:rgba(255,255,255,0.85);
                                                       border-radius:16px;
                                                       padding:32px;
                                                       box-shadow:0 8px 20px rgba(0,0,0,0.1);
                                                     }
                                                     h1 {
                                                       margin:0 0 20px 0;
                                                       font-size:24px;
                                                       font-weight:600;
                                                       color:#0b5fff;
                                                       text-align:center;
                                                     }
                                                     p {
                                                       margin:0 0 16px 0;
                                                       font-size:16px;
                                                       line-height:1.6;
                                                     }
                                                     .password-box {
                                                       background:#f1f4fb;
                                                       border-radius:8px;
                                                       padding:12px 16px;
                                                       margin:16px 0;
                                                       font-family:monospace;
                                                       font-size:16px;
                                                       font-weight:600;
                                                       color:#0b5fff;
                                                       text-align:center;
                                                     }
                                                     .footer {
                                                       margin-top:28px;
                                                       font-size:12px;
                                                       color:#6b7280;
                                                       text-align:center;
                                                     }
                                                     @media (max-width:600px) {
                                                       .card { padding:20px; }
                                                       h1 { font-size:20px; }
                                                       p { font-size:15px; }
                                                     }
                                                     @media (prefers-color-scheme: dark) {
                                                       body {
                                                         background:linear-gradient(135deg,#0f1115,#1b1e24);
                                                         color:#e7e7ea;
                                                       }
                                                       .card {
                                                         background:rgba(30,33,40,0.85);
                                                         border:1px solid #2a2f3a;
                                                       }
                                                       h1 { color:#7cb8ff; }
                                                       .password-box {
                                                         background:#252b36;
                                                         color:#7cb8ff;
                                                       }
                                                       .footer { color:#a7acb8; }
                                                     }
                                                   </style>
                                                 </head>
                                                 <body>
                                                   <div class="container">
                                                     <div class="card">
                                                       <h1>Password Reset by Administrator</h1>
                                                       <p>Hello <strong>{{User}}</strong>,</p>
                                                       <p>
                                                         Your password has been reset by the <strong>system administrator</strong>.  
                                                       </p>
                                                       <p>Here is your new password:</p>
                                                       <div class="password-box">
                                                         {{Password}}
                                                       </div>
                                                       <p>Best regards,<br/>PublicQ Team</p>
                                                       <div class="footer">
                                                         If you did not expect this reset, please contact support immediately.
                                                       </div>
                                                     </div>
                                                   </div>
                                                 </body>
                                               </html>
                                               """;
}