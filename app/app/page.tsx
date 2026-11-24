import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/http";
import { SignOutButton } from "@/components/SignOutButton";
export default async function AppHome() {
  const user = await currentUser();
  if (!user) redirect("/");
  return <main className="single"><section className="card"><div className="brand"><i/>LFTarena</div><h1>Welcome</h1><p className="lead">Signed in as {user.email}</p><SignOutButton/></section></main>;
}

