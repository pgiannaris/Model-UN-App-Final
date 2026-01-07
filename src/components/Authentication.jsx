import { Button } from "flowbite-react";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { NavbarProfile } from "./NavbarProfile";
import { useAuth } from "../hooks/useAuth";

export function Authentication(props) {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div {...props}>
        <NavbarProfile />
        <Button
          size="sm"
          color="gray"
          onClick={logout}
          className="cursor-pointer"
        >
          Logout
        </Button>
      </div>
    );
  }
  return (
    <div {...props}>
      <SignupModal />
      <LoginModal />
    </div>
  );
}
