export default interface TokenClaims {
    iss: string;
    type: "access" | "refresh";
    aud: string;
    name: string;
    exp: number;
}
