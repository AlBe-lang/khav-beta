import { useStore } from "../features/store";
import { RequesterShell } from "./components/shared";
import { Login } from "./pages/Login";
import { RequesterHome } from "./pages/RequesterHome";
import { FarmForm } from "./pages/FarmForm";
import { CaseForm } from "./pages/CaseForm";
import { CaseDetail } from "./pages/CaseDetail";
import { Admin } from "./pages/Admin";

export function App() {
  const { me, view } = useStore();
  if (!me) return <Login />;
  if (me.role === "관리자" || me.role === "검사자") return <Admin />;
  let page;
  if (view.name === "farm") page = <FarmForm />;
  else if (view.name === "case") page = <CaseForm />;
  else if (view.name === "case-detail") page = <CaseDetail id={view.id} />;
  else page = <RequesterHome />;
  return <RequesterShell>{page}</RequesterShell>;
}
