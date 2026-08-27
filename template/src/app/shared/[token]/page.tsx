// import PasswordGate from "./PasswordGate";

import PasswordGate from "./PasswordGate";

export default async function SharedFilePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PasswordGate token={token} />;
}