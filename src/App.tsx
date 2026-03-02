import { ThemeProvider } from "./context/ThemeContext";
import { ZoomProvider } from "./context/ZoomContext";
import { ConfigTreeProvider } from "./context/ConfigTreeContext";
import { AppLayout } from "./components/layout/AppLayout";

export default function App() {
  return (
    <ThemeProvider>
      <ZoomProvider>
        <ConfigTreeProvider>
          <AppLayout />
        </ConfigTreeProvider>
      </ZoomProvider>
    </ThemeProvider>
  );
}
