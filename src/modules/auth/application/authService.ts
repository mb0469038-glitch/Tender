import { type Result, err, ok } from "../../../shared/kernel/result";
import type { SessionInfo } from "../domain/entities";
import { tauriAuthGateway } from "../infrastructure/tauriAuthGateway";

const asError = (error: unknown) => (typeof error === "string" ? error : "Something went wrong. Please try again.");

export const authService = {
  async login(username: string, password: string): Promise<Result<SessionInfo>> {
    try {
      return ok(await tauriAuthGateway.login(username, password));
    } catch (error) {
      return err(asError(error));
    }
  },

  async logout(): Promise<void> {
    await tauriAuthGateway.logout();
  },

  async getCurrentSession(): Promise<SessionInfo | null> {
    return tauriAuthGateway.getCurrentSession();
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<Result<void>> {
    try {
      await tauriAuthGateway.changePassword(oldPassword, newPassword);
      return ok(undefined as void);
    } catch (error) {
      return err(asError(error));
    }
  },
};
