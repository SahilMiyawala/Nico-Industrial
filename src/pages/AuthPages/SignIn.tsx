import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Nico Industrial Solutions"
        description="Nico Industrial Solutions - Sign In"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
