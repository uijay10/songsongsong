import { Switch, Route, Router as WouterRouter } from "wouter";
import { Web3Provider } from "@/lib/web3";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import Showcase from "@/pages/showcase";
import KOLZone from "@/pages/kol";
import DeveloperColumn from "@/pages/developer";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import ApplySpace from "@/pages/apply";
import ProjectDetail from "@/pages/project-detail";
import SectionPage from "@/pages/section";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/showcase" component={Showcase} />
      <Route path="/kol" component={KOLZone} />
      <Route path="/developer" component={DeveloperColumn} />
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route path="/apply" component={ApplySpace} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/section/:slug" component={SectionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Web3Provider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Router />
        </Layout>
      </WouterRouter>
    </Web3Provider>
  );
}

export default App;
