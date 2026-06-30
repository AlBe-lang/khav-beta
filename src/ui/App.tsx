// ui/App — 간단 라우터
import { useStore } from "../features/store";
import { TabBar } from "./components/shared";
import { Login } from "./pages/Login";
import { RequesterHome } from "./pages/RequesterHome";
import { FarmForm } from "./pages/FarmForm";
import { CaseForm } from "./pages/CaseForm";
import { CaseDetail } from "./pages/CaseDetail";
import { Admin } from "./pages/Admin";

export function App() {
  const { view, user } = useStore();

  let screen;
  if (!user) screen = <Login />;
  else if (view.name === "admin") screen = <Admin />;
  else if (view.name === "farm") screen = <FarmForm />;
  else if (view.name === "case") screen = <CaseForm />;
  else if (view.name === "case-detail") screen = <CaseDetail id={view.id} />;
  else screen = <RequesterHome />;

  return (
    <div className="app">
      {screen}
      <TabBar />
    </div>
  );
}
