import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import WordCardsPage from "@/pages/WordCardsPage";
import SentencesPage from "@/pages/SentencesPage";
import QuizPage from "@/pages/QuizPage";
import MiniGamePage from "@/pages/MiniGamePage";
import ProgressPage from "@/pages/ProgressPage";
import TranslatePage from "@/pages/TranslatePage";
import AIWordCardsPage from "@/pages/AIWordCardsPage";
import AISentencesPage from "@/pages/AISentencesPage";
import AdvancedTranslatePage from "@/pages/AdvancedTranslatePage";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/cards" component={WordCardsPage} />
      <Route path="/sentences" component={SentencesPage} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/game" component={MiniGamePage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/translate" component={TranslatePage} />
      <Route path="/ai-cards" component={AIWordCardsPage} />
      <Route path="/ai-sentences" component={AISentencesPage} />
      <Route path="/ai-translate" component={AdvancedTranslatePage} />
      <Route component={HomePage} />
    </Switch>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-[calc(72px+env(safe-area-inset-top))] pb-20">
        <MainRouter />
      </main>
      
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
