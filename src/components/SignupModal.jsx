import React from "react";
import {
  Button,
  Label,
  TextInput,
  Modal,
  ModalHeader,
  ModalBody,
} from "flowbite-react";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/useAuth";
import { useInsert } from "../hooks/database";

export function SignupModal(props) {
  const [isOpen, setOpenModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { signup, error, clear } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const insertNeedingApproval = useInsert("studentsNeedingApproval");

  async function onSubmit(data) {
    console.log("Form Data:", data); // 👈 Logs everything
    setIsLoading(true);
    insertNeedingApproval.call({
      email: data.email,
      name: data.name,
    });
    const success = await signup(data);
    console.log("Signup success:", success);
    setIsLoading(false);
    if (success) hide();
  }
  // { avatar: "", collectionId: "_pb_users_auth_", collectionName: "users", created: "2025-10-24 03:00:43.290Z", email: "kasd@gm.com", emailVisibility: true, firstName: "pan", id: "4elu36s757cnl8c", lastName: "pon", updated: "2025-10-24 03:00:43.290Z", … }
  function show() {
    setOpenModal(true);
  }

  function hide() {
    reset();
    clear();
    setOpenModal(false);
  }

  return (
    <div>
      <Button
        size={props.size ? props.size : "sm"}
        className="cursor-pointer"
        onClick={show}
      >
        Signup
      </Button>

      <Modal dismissible show={isOpen} onClose={hide} size="sm">
        <ModalHeader>Signup</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
            <Label>Name:</Label>
            <TextInput type="text" {...register("name", { required: true })} />

            <Label>Email:</Label>
            <TextInput
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
            />

            <Label>Password:</Label>
            <TextInput
              type="password"
              autoComplete="new-password"
              {...register("password", { required: true })}
            />

            <Label>Confirm Password:</Label>
            <TextInput
              className="mb-2"
              type="password"
              autoComplete="new-password"
              {...register("passwordConfirm", { required: true })}
            />

            <Button
              type="submit"
              className="cursor-pointer"
              isProcessing={isLoading}
              disabled={isLoading}
            >
              Create New User
            </Button>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}
