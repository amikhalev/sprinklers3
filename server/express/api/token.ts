import PromiseRouter from "express-promise-router";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";
import * as httpApi from "@common/httpApi";
import * as authentication from "@server/authentication";
import { User } from "@server/entities";
import { verifyAuthorization } from "@server/express/verifyAuthorization";
import { ServerState } from "@server/state";

export function token(state: ServerState) {
  const router = PromiseRouter();

  async function passwordGrant(
    body: httpApi.TokenGrantPasswordRequest,
    res: Express.Response
  ): Promise<User> {
    const { username, password } = body;
    if (!body || !username || !password) {
      throw new ApiError("Must specify username and password");
    }
    const user = await state.database.users.findByUsername(username);
    if (!user) {
      throw new ApiError("User does not exist");
    }
    const passwordMatches = await user.comparePassword(password);
    if (passwordMatches) {
      return user;
    } else {
      throw new ApiError("Invalid user credentials");
    }
  }

  async function refreshGrant(
    body: httpApi.TokenGrantRefreshRequest,
    res: Express.Response
  ): Promise<User> {
    const { refresh_token } = body;
    if (!body || !refresh_token) {
      throw new ApiError("Must specify a refresh_token", ErrorCode.BadToken);
    }
    const claims = await authentication.verifyToken(refresh_token);
    if (claims.type !== "refresh") {
      throw new ApiError("Not a refresh token", ErrorCode.BadToken);
    }
    const user = await state.database.users.findOne(claims.aud);
    if (!user) {
      throw new ApiError("User no longer exists", ErrorCode.BadToken);
    }
    return user;
  }

  router.post("/grant", async (req, res) => {
    const body: httpApi.TokenGrantRequest = req.body;
    let user: User;
    if (body.grant_type === "password") {
      user = await passwordGrant(body, res);
    } else if (body.grant_type === "refresh") {
      user = await refreshGrant(body, res);
    } else {
      throw new ApiError("Invalid grant_type");
    }
    // tslint:disable-next-line:variable-name
    const [access_token, refresh_token] = await Promise.all([
      await authentication.generateAccessToken(user),
      await authentication.generateRefreshToken(user)
    ]);
    const response: httpApi.TokenGrantResponse = {
      access_token,
      refresh_token
    };
    res.json(response);
  });

  router.post("/grant_device_reg", verifyAuthorization(), async (req, res) => {
    // tslint:disable-next-line:no-shadowed-variable
    const token = await authentication.generateDeviceRegistrationToken();
    res.json({ token });
  });

  router.post("/verify", verifyAuthorization(), async (req, res) => {
    res.json({
      ok: true,
      token: req.token
    });
  });

  return router;
}
