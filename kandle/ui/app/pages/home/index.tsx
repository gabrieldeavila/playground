import { memo } from "react";

import TicketWorkspace from "../../components/TicketWorkspace";

export const meta = () => [{ title: "Kandle — Gráfico de ações" }];

const Home = memo(() => {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-(--color-bg)">
      <TicketWorkspace />
    </main>
  );
});

Home.displayName = "Home";

export default Home;
