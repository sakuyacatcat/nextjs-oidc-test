import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
// import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Keycloak
    Keycloak({
      clientId: process.env.KEYCLOAK_ID,
      clientSecret: process.env.KEYCLOAK_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),

    // Microsoft Entra ID (Azure AD)
    // MicrosoftEntraID({
    //   clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    //   clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    //   issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    // }),
  ],
});
