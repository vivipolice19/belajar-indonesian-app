import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { AdvancedTranslateScreen } from "../screens/AdvancedTranslateScreen";
import { AICardsScreen } from "../screens/AICardsScreen";
import { AISentencesScreen } from "../screens/AISentencesScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MiniGameScreen } from "../screens/MiniGameScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { QuizScreen } from "../screens/QuizScreen";
import { SentencesScreen } from "../screens/SentencesScreen";
import { TranslateScreen } from "../screens/TranslateScreen";
import { WordCardsScreen } from "../screens/WordCardsScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeRoute() {
  return (
    <ScreenScaffold routeName="Home">
      <HomeScreen />
    </ScreenScaffold>
  );
}

function WordCardsRoute() {
  return (
    <ScreenScaffold routeName="WordCards">
      <WordCardsScreen />
    </ScreenScaffold>
  );
}

function SentencesRoute() {
  return (
    <ScreenScaffold routeName="Sentences">
      <SentencesScreen />
    </ScreenScaffold>
  );
}

function QuizRoute() {
  return (
    <ScreenScaffold routeName="Quiz">
      <QuizScreen />
    </ScreenScaffold>
  );
}

function MiniGameRoute() {
  return (
    <ScreenScaffold routeName="MiniGame">
      <MiniGameScreen />
    </ScreenScaffold>
  );
}

function ProgressRoute() {
  return (
    <ScreenScaffold routeName="Progress">
      <ProgressScreen />
    </ScreenScaffold>
  );
}

function TranslateRoute() {
  return (
    <ScreenScaffold routeName="Translate">
      <TranslateScreen />
    </ScreenScaffold>
  );
}

function AICardsRoute() {
  return (
    <ScreenScaffold routeName="AICards">
      <AICardsScreen />
    </ScreenScaffold>
  );
}

function AISentencesRoute() {
  return (
    <ScreenScaffold routeName="AISentences">
      <AISentencesScreen />
    </ScreenScaffold>
  );
}

function AdvancedTranslateRoute() {
  return (
    <ScreenScaffold routeName="AdvancedTranslate">
      <AdvancedTranslateScreen />
    </ScreenScaffold>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeRoute} />
      <Stack.Screen name="WordCards" component={WordCardsRoute} />
      <Stack.Screen name="Sentences" component={SentencesRoute} />
      <Stack.Screen name="Quiz" component={QuizRoute} />
      <Stack.Screen name="MiniGame" component={MiniGameRoute} />
      <Stack.Screen name="Progress" component={ProgressRoute} />
      <Stack.Screen name="Translate" component={TranslateRoute} />
      <Stack.Screen name="AICards" component={AICardsRoute} />
      <Stack.Screen name="AISentences" component={AISentencesRoute} />
      <Stack.Screen name="AdvancedTranslate" component={AdvancedTranslateRoute} />
    </Stack.Navigator>
  );
}
