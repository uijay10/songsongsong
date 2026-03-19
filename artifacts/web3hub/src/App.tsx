import { Switch, Route, Router as WouterRouter } from "wouter";
import { Web3Provider } from "@/lib/web3";
import { LanguageProvider } from "@/lib/i18n";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Showcase from "@/pages/showcase";
import KOLZone from "@/pages/kol";
import DeveloperColumn from "@/pages/developer";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import ApplySpace from "@/pages/apply";
import PostNew from "@/pages/post-new";
import ProjectDetail from "@/pages/project-detail";
import SectionPage from "@/pages/section";
import AdminPage from "@/pages/admin";
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
      <Route path="/post/new" component={PostNew} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/section/:slug" component={SectionPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Web3Provider>
      <LanguageProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
      </LanguageProvider>
    </Web3Provider>
  );
}

export default App;
