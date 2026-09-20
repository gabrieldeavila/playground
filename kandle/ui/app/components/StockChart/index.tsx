import { StockChartBaseProvider } from "./context/StockChartBaseContext";
import { StockChartServicesProvider } from "./context/StockChartServicesContext";
import StockChartContent from "./features/content";
import "./css/style.css";

const StockChart = () => {
  return (
    <StockChartBaseProvider>
      <StockChartServicesProvider>
        <StockChartContent />
      </StockChartServicesProvider>
    </StockChartBaseProvider>
  );
};

export default StockChart;