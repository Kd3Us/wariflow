export const environment = {
    production: false,
    apiProjectURL: 'http://localhost:3009/projects',
    //apiWorkspaceURL: 'http://18.169.1.118:3009/workspaces',
    apiWorkspaceURL: 'http://localhost:3009/workspaces',
    apiProjectManagementURL: 'https://localhost:3009/project-management',
    apiTeamsURL: 'http://localhost:3009/teams',
  //  externaleAuthUrl: "https://startupkit.distribute.app/",
    externaleAuthUrl: "http://startupkit.speedpresta.com/",
   // verifyTokenUrl: "https://api.speedpresta.com/api/v1/verify/token",
   verifyTokenUrl: "http://localhost:3009/auth/login",
    jwtSecret: "votre_secret_jwt"
};
