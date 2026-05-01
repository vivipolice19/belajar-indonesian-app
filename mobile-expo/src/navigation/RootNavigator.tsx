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
import { WordCardsScreen } from "../screens/WordCardsScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeRoute() {
  return (
    <ScreenScaffold>
      <HomeScreen />
    </ScreenScaffold>
  );
}

function WordCardsRoute() {
  return (
    <ScreenScaffold>
      <AICardsScreen />
    </ScreenScaffold>
  );
}

function BasicWordCardsRoute() {
  return (
    <ScreenScaffold>
      <WordCardsScreen />
    </ScreenScaffold>
  );
}

function SentencesRoute() {
  return (
    <ScreenScaffold>
      <AISentencesScreen />
    </ScreenScaffold>
  );
}

function BasicSentencesRoute() {
  return (
    <ScreenScaffold>
      <SentencesScreen />
    </ScreenScaffold>
  );
}

function QuizRoute() {
  return (
    <ScreenScaffold>
      <QuizScreen />
    </ScreenScaffold>
  );
}

function MiniGameRoute() {
  return (
    <ScreenScaffold>
      <MiniGameScreen />
    </ScreenScaffold>
  );
}

function ProgressRoute() {
  return (
    <ScreenScaffold>
      <ProgressScreen />
    </ScreenScaffold>
  );
}

function AdvancedTranslateRoute() {
  return (
    <ScreenScaffold scroll={false}>
      <AdvancedTranslateScreen />
    </ScreenScaffold>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeRoute} />
      <Stack.Screen name="WordCards" component={WordCardsRoute} />
      <Stack.Screen name="BasicWordCards" component={BasicWordCardsRoute} />
      <Stack.Screen name="Sentences" component={SentencesRoute} />
      <Stack.Screen name="BasicSentences" component={BasicSentencesRoute} />
      <Stack.Screen name="Quiz" component={QuizRoute} />
      <Stack.Screen name="MiniGame" component={MiniGameRoute} />
      <Stack.Screen name="Progress" component={ProgressRoute} />
      <Stack.Screen name="AdvancedTranslate" component={AdvancedTranslateRoute} />
    </Stack.Navigator>
  );
}
