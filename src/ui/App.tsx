import { useStore } from "../features/store";
import { TabBar } from "./components/shared";
import { Login } from "./pages/Login";
import { RequesterHome } from "./pages/RequesterHome";
import { FarmForm } from "./pages/FarmForm";
import { CaseForm } from "./pages/CaseForm";
import { CaseDetail } from "./pages/CaseDetail";
import { Admin } from "./pages/Admin";

export function App() {
  const { me, view } = useStore();
  let screen;
  if (!me) screen = <Login />;
  else if (me.role === "관리자" || me.role === "검사자") screen = <Admin />;
  else if (view.name === "farm") screen = <FarmForm />;
  else if (view.name === "case") screen = <CaseForm />;
  else if (view.name === "case-detail") screen = <CaseDetail id={view.id} />;
  else screen = <RequesterHome />;
  return <div className="app">{screen}<TabBar /></div>;
}
