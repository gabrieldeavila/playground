import { memo } from "react";

import StockChart from "../../components/StockChart";

const Home = memo(() => {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-(--color-bg)">
      <StockChart />
    </main>
  );
});

Home.displayName = "Home";

export default Home;
