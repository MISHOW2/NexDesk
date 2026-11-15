import * as userService from "../services/userService.js";

const userRoles = new Set(["user", "agent", "admin"]);

export async function getUsers(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: await userService.listUsers(),
    });
  } catch (error) {
    console.error("Unable to list users:", error);
    return res.status(500).json({ success: false, message: "Unable to list users" });
  }
}

export async function updateUserRole(req, res) {
  const userId = Number(req.params.userId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  const role = typeof req.body?.role === "string" ? req.body.role.trim().toLowerCase() : "";
  if (!userRoles.has(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be user, agent, or admin",
    });
  }

  try {
    const user = await userService.changeUserRole(userId, role, req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.code === "SELF_ROLE_CHANGE") {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error("Unable to update user role:", error);
    return res.status(500).json({ success: false, message: "Unable to update user role" });
  }
}
