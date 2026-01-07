import { Label } from "flowbite-react";
import { useAuth } from "../hooks/useAuth";

export function NavbarProfile() {
  const { user } = useAuth();

  console.log(user);

  if (!user) return;

  return <p>{user.email}</p>;
}
