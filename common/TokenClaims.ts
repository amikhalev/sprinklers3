export default interface TokenClaims {
    iss: string;
    type: "access" | "refresh";
    aud: number;
    name: string;
    exp: number;
}
