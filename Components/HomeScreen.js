// Components/HomeScreen.js
import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppCtx } from '../App';
import LinearGradient from 'react-native-linear-gradient';

const BG = require('../assets/bg.webp');
const AVATAR_FALLBACK = require('../assets/photo_holder.webp');
const QUEEN = require('../assets/onb_queen.webp');

const SCARAB = require('../assets/scarab.webp');
const PYRAMID = require('../assets/pyramid.webp');
const FLOWER = require('../assets/flower.webp');
const QUEEN_ICON = require('../assets/onb_queen.webp');

const INFO_ICON = require('../assets/info.webp'); // если нет — замени/удали

// ✅ ключи как в RegistrationScreen
const STORAGE_PROFILE = '@qcw_profile';
const STORAGE_PROGRESS = '@qcw_progress_v1';
const LEGACY_PROGRESS = 'qcw_progress_v1'; // на всякий случай

const COLORS = {
  bg: '#000000',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.72)',

  // ✅ синий
  lime: '#0066FF',
  limeSoft: 'rgba(0, 102, 255, 0.35)',
  limeSoft2: 'rgba(0, 102, 255, 0.18)',

  // карточки/контейнеры
  card: 'rgba(0,0,0,0.62)',
  card2: 'rgba(0,0,0,0.46)',
};


// Quiz questions with 3 answer options
const QUIZ_QUESTIONS = [
  {
    question: 'What helps maintain inner balance?',
    answers: ['Regular meditation', 'Constant activity', 'Ignoring emotions'],
    correct: 0,
    info: 'Regular meditation helps maintain inner balance and emotional stability.',
  },
  {
    question: 'What is the key to personal growth?',
    answers: ['Self-reflection', 'Comparing with others', 'Avoiding challenges'],
    correct: 0,
    info: 'Self-reflection is essential for personal growth and understanding yourself.',
  },
  {
    question: 'How to develop self-confidence?',
    answers: ['Accept your uniqueness', 'Copy others', 'Hide your feelings'],
    correct: 0,
    info: 'Accepting your uniqueness builds genuine self-confidence.',
  },
  {
    question: 'What strengthens relationships?',
    answers: ['Honest communication', 'Avoiding conflicts', 'Pretending everything is fine'],
    correct: 0,
    info: 'Honest communication is the foundation of strong relationships.',
  },
  {
    question: 'What helps in difficult times?',
    answers: ['Support from loved ones', 'Isolation', 'Ignoring problems'],
    correct: 0,
    info: 'Support from loved ones helps us overcome difficult times.',
  },
  {
    question: 'How to find inner peace?',
    answers: ['Practice mindfulness', 'Control everything', 'Avoid silence'],
    correct: 0,
    info: 'Practicing mindfulness helps find inner peace and harmony.',
  },
  {
    question: 'What is important for mental health?',
    answers: ['Self-care', 'Constant work', 'Ignoring needs'],
    correct: 0,
    info: 'Self-care is crucial for maintaining mental health and well-being.',
  },
  {
    question: 'How to achieve goals?',
    answers: ['Small consistent steps', 'Waiting for the right moment', 'Giving up easily'],
    correct: 0,
    info: 'Small consistent steps lead to achieving big goals.',
  },
  {
    question: 'What brings happiness?',
    answers: ['Gratitude for what you have', 'Constant desire for more', 'Comparing with others'],
    correct: 0,
    info: 'Gratitude for what you have brings true happiness and contentment.',
  },
  {
    question: 'How to develop creativity?',
    answers: ['Allow yourself to experiment', 'Follow only rules', 'Avoid new experiences'],
    correct: 0,
    info: 'Allowing yourself to experiment and try new things develops creativity.',
  },
];

const getRandomArtifactType = () => {
  const types = ['pyramid', 'scarab', 'flower'];
  return types[Math.floor(Math.random() * types.length)];
};

export default function HomeScreen({ navigation }) {
  const ctx = useContext(AppCtx);
  // ✅ артефакты НЕ статичные — берем из контекста
  const artifacts = ctx?.artifacts || { scarab: 0, pyramid: 0, flower: 0 };

  const [user, setUser] = useState({
    name: '',
    about: '',
    photoUri: null,
  });

  const [progress, setProgress] = useState({
    dayIndex: 1,
    done: [false, false, false, false],
    cooldownUntil: 0,
    artifacts: { scarab: 0, pyramid: 0, flower: 0 },
  });

  const [now, setNow] = useState(Date.now());

  // Quiz state
  const [quizVisible, setQuizVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizInfo, setQuizInfo] = useState('');
  const [quizTimeLeft, setQuizTimeLeft] = useState(30);
  const [quizGameOver, setQuizGameOver] = useState(false);
  const [quizTimerActive, setQuizTimerActive] = useState(false);

  // тик для countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // функция загрузки прогресса
  const loadProgress = useCallback(async () => {
    try {
      const raw = (await AsyncStorage.getItem(STORAGE_PROGRESS)) || (await AsyncStorage.getItem(LEGACY_PROGRESS));
      if (raw) {
        const parsed = JSON.parse(raw);
        // Убеждаемся, что массив done имеет 4 элемента
        let done = Array.isArray(parsed.done) ? [...parsed.done] : [false, false, false, false];
        while (done.length < 4) {
          done.push(false);
        }
        // Обрезаем до 4 элементов, если больше
        if (done.length > 4) {
          done = done.slice(0, 4);
        }
        const normalizedProgress = { ...parsed, done };
        console.log('HomeScreen: Progress loaded', { done: normalizedProgress.done });
        setProgress((prev) => ({ ...prev, ...normalizedProgress }));
        
        // Синхронизируем артефакты из прогресса с контекстом
        if (parsed?.artifacts && ctx?.addArtifacts) {
          const progressArtifacts = parsed.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
          const ctxArtifacts = ctx.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
          
          // Добавляем разницу, если в прогрессе больше артефактов
          const diff = {
            scarab: Math.max(0, progressArtifacts.scarab - ctxArtifacts.scarab),
            pyramid: Math.max(0, progressArtifacts.pyramid - ctxArtifacts.pyramid),
            flower: Math.max(0, progressArtifacts.flower - ctxArtifacts.flower),
          };
          
          if (diff.scarab > 0 || diff.pyramid > 0 || diff.flower > 0) {
            ctx.addArtifacts(diff);
          }
        }
      }
    } catch {}
  }, [ctx]);

  // загрузка профиля (только один раз)
  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem(STORAGE_PROFILE);
        if (p) {
          const parsed = JSON.parse(p);
          setUser({
            name: parsed?.name ?? '',
            about: parsed?.about ?? '',
            photoUri: parsed?.photoUri ?? null,
          });
        }
      } catch {}
    })();
  }, []);

  // загрузка прогресса при монтировании
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // перечитываем прогресс когда экран получает фокус (возврат с TaskScreen)
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // Синхронизация артефактов из контекста в прогресс (когда контекст обновляется после траты)
  useEffect(() => {
    if (ctx?.artifacts) {
      const ctxArtifacts = ctx.artifacts;
      const progressArtifacts = progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 };
      
      // Обновляем прогресс если артефакты в контексте изменились (например, после траты в Exchanger)
      if (
        ctxArtifacts.scarab !== progressArtifacts.scarab ||
        ctxArtifacts.pyramid !== progressArtifacts.pyramid ||
        ctxArtifacts.flower !== progressArtifacts.flower
      ) {
        setProgress((p) => ({
          ...p,
          artifacts: ctxArtifacts,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.artifacts]);

  // сохраняем прогресс
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  const isCooldown = progress.cooldownUntil && now < progress.cooldownUntil;

  const firstUndoneIndex = useMemo(() => {
    const done = Array.isArray(progress.done) ? progress.done : [false, false, false, false];
    const normalizedDone = done.length === 4 ? done : [...done, ...Array(4 - done.length).fill(false)];
    const idx = normalizedDone.findIndex((x) => !x);
    return idx === -1 ? 0 : idx;
  }, [progress.done]);

  const allDone = useMemo(() => {
    const done = Array.isArray(progress.done) ? progress.done : [false, false, false, false];
    if (done.length !== 4) return false;
    return done.every(Boolean);
  }, [progress.done]);

  // если все выполнено и cooldown не выставлен — ставим 24ч
  useEffect(() => {
    if (allDone && !progress.cooldownUntil) {
      setProgress((p) => ({ ...p, cooldownUntil: Date.now() + 24 * 60 * 60 * 1000 }));
    }
  }, [allDone, progress.cooldownUntil]);

  // если cooldown прошел — новый день
  useEffect(() => {
    if (progress.cooldownUntil && now >= progress.cooldownUntil && progress.cooldownUntil > 0) {
      const newProgress = {
        ...progress,
        dayIndex: progress.dayIndex + 1,
        done: [false, false, false, false],
        cooldownUntil: 0,
        // Сохраняем артефакты при переходе на новый день
        artifacts: progress.artifacts || { scarab: 0, pyramid: 0, flower: 0 },
      };
      // Сохраняем сразу в AsyncStorage синхронно
      AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(newProgress)).catch(() => {});
      setProgress(newProgress);
    }
  }, [now, progress]);

  const countdown = useMemo(() => {
    if (!isCooldown) return '00:00:00';
    const left = Math.max(0, progress.cooldownUntil - now);

    const h = Math.floor(left / (1000 * 60 * 60));
    const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((left % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [isCooldown, progress.cooldownUntil, now]);

  const onPressTask = (index) => {
    if (isCooldown) return;
    navigation.getParent()?.navigate('Task', { taskIndex: index, dayIndex: progress.dayIndex });
  };

  const onPrimaryPress = () => {
    if (isCooldown) return;
    onPressTask(firstUndoneIndex);
  };

  const primaryLabel = useMemo(() => {
    if (isCooldown) return 'Cooldown';
    if (progress.done.every((x) => !x)) return 'Start day';
    if (allDone) return 'Done';
    return 'Next task';
  }, [isCooldown, progress.done, allDone]);

  const displayName = user.name?.trim() ? user.name.trim() : 'User';
  const displayAbout = user.about?.trim() ? user.about.trim() : 'Welcome back';

  const noPhoto = !user.photoUri;

  // Quiz functions
  const startQuiz = () => {
    // Check if user has at least one artifact
    const hasArtifacts = (artifacts?.scarab ?? 0) > 0 || 
                        (artifacts?.pyramid ?? 0) > 0 || 
                        (artifacts?.flower ?? 0) > 0;
    
    if (!hasArtifacts) {
      Alert.alert('Not enough', 'You need at least 1 artifact to start the quiz.');
      return;
    }

    // Spend 1 random artifact
    const artifactType = getRandomArtifactType();
    if (!ctx?.canSpend?.({ [artifactType]: 1 })) {
      // Try another type
      const availableTypes = [];
      if ((artifacts?.scarab ?? 0) > 0) availableTypes.push('scarab');
      if ((artifacts?.pyramid ?? 0) > 0) availableTypes.push('pyramid');
      if ((artifacts?.flower ?? 0) > 0) availableTypes.push('flower');
      
      if (availableTypes.length === 0) {
        Alert.alert('Not enough', 'You need at least 1 artifact to start the quiz.');
        return;
      }
      
      const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const ok = ctx?.spend?.({ [selectedType]: 1 });
      if (!ok) {
        Alert.alert('Not enough', 'You need at least 1 artifact to start the quiz.');
        return;
      }
    } else {
      const ok = ctx?.spend?.({ [artifactType]: 1 });
      if (!ok) {
        Alert.alert('Not enough', 'You need at least 1 artifact to start the quiz.');
        return;
      }
    }

    // Reset quiz state
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setQuizInfo('');
    setQuizTimeLeft(30);
    setQuizGameOver(false);
    setQuizTimerActive(true);
    setQuizVisible(true);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null || quizGameOver) return; // Already answered or game over
    
    // Stop timer when answer is selected
    setQuizTimerActive(false);
    
    setSelectedAnswer(answerIndex);
    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Show info after a short delay
    setTimeout(() => {
      setQuizInfo(currentQuestion.info);
    }, 500);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setQuizInfo('');
      setQuizTimeLeft(30);
      setQuizTimerActive(true);
    } else {
      setQuizFinished(true);
      setQuizTimerActive(false);
    }
  };

  const closeQuiz = () => {
    setQuizVisible(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setQuizInfo('');
    setQuizTimeLeft(30);
    setQuizGameOver(false);
    setQuizTimerActive(false);
  };

  // Quiz timer effect
  useEffect(() => {
    if (!quizVisible || !quizTimerActive || quizFinished || quizGameOver || selectedAnswer !== null) {
      return;
    }

    if (quizTimeLeft <= 0) {
      setQuizTimerActive(false);
      setQuizGameOver(true);
      return;
    }

    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          setQuizTimerActive(false);
          setQuizGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizVisible, quizTimerActive, quizTimeLeft, quizFinished, quizGameOver, selectedAnswer]);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safe}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <Image
                  source={user.photoUri ? { uri: user.photoUri } : AVATAR_FALLBACK}
                  style={[styles.avatar, noPhoto && styles.avatarTint]}
                />
              </View>

              <View style={styles.headerTextWrap}>
                <Text style={styles.hello}>Hello, {displayName}</Text>
                <Text style={styles.sub}>{displayAbout}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.infoBtn}
              onPress={() => navigation.navigate('Info')}
            >
              <Image source={INFO_ICON} style={styles.infoIcon} />
            </TouchableOpacity>
          </View>

          {/* Artifacts (dynamic from context) */}
          <View style={styles.artifactsCard}>
            <Text style={styles.artifactsLabel}>Artifacts:</Text>

            <View style={styles.artItem}>
              <Image source={SCARAB} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.scarab ?? 0}</Text>
            </View>

            <View style={styles.artItem}>
              <Image source={PYRAMID} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.pyramid ?? 0}</Text>
            </View>

            <View style={styles.artItem}>
              <Image source={FLOWER} style={styles.artIcon} />
              <Text style={styles.artCount}>{artifacts?.flower ?? 0}</Text>
            </View>
          </View>

          {/* Quiz Card */}
          <View style={styles.quizCard}>
            <Text style={styles.quizTitle}>Quiz</Text>
            <Text style={styles.quizSub}>10 questions, 1 random artifact entry</Text>
            
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.quizStartBtn,
                ((artifacts?.scarab ?? 0) === 0 && (artifacts?.pyramid ?? 0) === 0 && (artifacts?.flower ?? 0) === 0) && styles.quizStartBtnDisabled
              ]}
              onPress={startQuiz}
              disabled={(artifacts?.scarab ?? 0) === 0 && (artifacts?.pyramid ?? 0) === 0 && (artifacts?.flower ?? 0) === 0}
            >
              <Text style={styles.quizStartBtnText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>

          {/* Main card */}
          <View style={styles.mainCard}>
            <Text style={styles.dayTitle}>Day {progress.dayIndex}</Text>

            {/* 4 tasks */}
            <View style={styles.tasksRow}>
              {[0, 1, 2, 3].map((i) => {
                const doneArray = Array.isArray(progress.done) && progress.done.length === 4 
                  ? progress.done 
                  : [false, false, false, false];
                const done = doneArray[i] || false;
                const locked = isCooldown;

                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.9}
                    onPress={() => onPressTask(i)}
                    disabled={locked}
                    style={[
                      styles.taskPill,
                      done ? styles.taskPillDone : styles.taskPillIdle,
                      locked && styles.taskPillLocked,
                    ]}
                  >
                    <View style={styles.taskInnerCircle}>
                      {done ? (
                        <Text style={styles.taskCheckmark}>✓</Text>
                      ) : (
                        <Text style={styles.taskNum}>{i + 1}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* queen card */}
            <View style={styles.queenCard}>
              <Image source={QUEEN} style={styles.queenImg} resizeMode="contain" />
              <View style={styles.queenRight}>
                {!isCooldown ? (
                  <>
                    <Text style={styles.queenText}>
                      {allDone
                        ? "That's all for today.\nSee you tomorrow!"
                        : 'Start the task and\nbecome the most\nbeautiful'}
                    </Text>

                    {allDone ? (
                      <Text style={styles.countdown}>{countdown}</Text>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.limeBtn}
                        onPress={onPrimaryPress}
                      >
                        <Text style={styles.limeBtnText}>{primaryLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.queenText}>{"That's all for today.\nSee you tomorrow!"}</Text>
                    <Text style={styles.countdown}>{countdown}</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomPad} />
      </SafeAreaView>

      {/* Quiz Modal */}
      <Modal
        transparent
        visible={quizVisible}
        animationType="fade"
        onRequestClose={closeQuiz}
      >
        <View style={styles.quizModalOverlay}>
          <View style={styles.quizModalCard}>
            <LinearGradient
              colors={[withAlpha(COLORS.lime, 0.95), 'rgba(0,0,0,0.90)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.quizModalContent}>
              {!quizFinished && !quizGameOver ? (
                <>
                  <View style={styles.quizHeaderRow}>
                    <Text style={styles.quizModalTitle}>
                      Question {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}
                    </Text>
                    <View style={[styles.quizTimer, quizTimeLeft <= 10 && styles.quizTimerWarning]}>
                      <Text style={styles.quizTimerText}>{quizTimeLeft}s</Text>
                    </View>
                  </View>
                  <Text style={styles.quizScore}>Score: {score} / {currentQuestionIndex + 1}</Text>

                  <View style={styles.quizQuestionCard}>
                    <Text style={styles.quizQuestionText}>{currentQuestion?.question}</Text>
                  </View>

                  <View style={styles.quizAnswersContainer}>
                    {currentQuestion?.answers.map((answer, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuestion.correct;
                      const showResult = selectedAnswer !== null || quizGameOver;

                      return (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.9}
                          style={[
                            styles.quizAnswerBtn,
                            isSelected && styles.quizAnswerBtnSelected,
                            showResult && isCorrect && styles.quizAnswerBtnCorrect,
                            showResult && isSelected && !isCorrect && styles.quizAnswerBtnWrong,
                            (selectedAnswer !== null || quizGameOver) && !isSelected && !isCorrect && styles.quizAnswerBtnDisabled,
                          ]}
                          onPress={() => handleAnswerSelect(index)}
                          disabled={selectedAnswer !== null || quizGameOver}
                        >
                          <Text style={styles.quizAnswerText}>{answer}</Text>
                          {showResult && isCorrect && (
                            <Text style={styles.quizAnswerMark}>✓</Text>
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <Text style={styles.quizAnswerMarkWrong}>✗</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {(quizInfo || quizGameOver) ? (
                    <View style={styles.quizInfoCard}>
                      <Text style={styles.quizInfoText}>
                        {quizGameOver ? 'Time is up! The correct answer is highlighted.' : quizInfo}
                      </Text>
                    </View>
                  ) : null}

                  {(selectedAnswer !== null || quizGameOver) && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.quizNextBtn}
                      onPress={quizGameOver ? closeQuiz : handleNextQuestion}
                    >
                      <Text style={styles.quizNextBtnText}>
                        {quizGameOver 
                          ? 'Close' 
                          : currentQuestionIndex < QUIZ_QUESTIONS.length - 1 
                          ? 'Next Question' 
                          : 'Finish'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : quizGameOver ? (
                <>
                  <Text style={styles.quizModalTitle}>Game Over</Text>
                  <Text style={styles.quizFinalMessage}>
                    Time ran out!{'\n\n'}You answered {score} out of {currentQuestionIndex + 1} questions correctly.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.quizModalBtn}
                    onPress={closeQuiz}
                  >
                    <Text style={styles.quizModalBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.quizModalTitle}>Quiz Completed!</Text>
                  <Text style={styles.quizFinalScore}>
                    Your score: {score} / {QUIZ_QUESTIONS.length}
                  </Text>
                  <Text style={styles.quizFinalMessage}>
                    {score === QUIZ_QUESTIONS.length
                      ? 'Perfect! You answered all questions correctly!'
                      : score >= QUIZ_QUESTIONS.length * 0.7
                      ? 'Great job! You did very well!'
                      : 'Good try! Keep learning and improving!'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.quizModalBtn}
                    onPress={closeQuiz}
                  >
                    <Text style={styles.quizModalBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const withAlpha = (hex, a = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${a})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? 18 : 0 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // ✅ как в регистрации: обводка + фон
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // ✅ если фото не выбрано — placeholder красный
  avatarTint: {
    resizeMode: 'contain',
    tintColor: COLORS.lime,
    opacity: 0.95,
  },

  headerTextWrap: { justifyContent: 'center' },
  hello: { color: COLORS.text, fontSize: 28, fontWeight: '700' },
  sub: { color: COLORS.dim, marginTop: 4, fontSize: 16 },

  infoBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { width: 20, height: 20, tintColor: COLORS.lime },

  artifactsCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  artifactsLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 14, marginRight: 10 },

  artItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artIcon: { width: 22, height: 22, resizeMode: 'contain' },
  artCount: { color: COLORS.text, fontSize: 20, fontWeight: '800', minWidth: 18, textAlign: 'center' },

  mainCard: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    borderRadius: 18,
    padding: 16,
  },
  dayTitle: { color: COLORS.text, fontSize: 34, fontWeight: '900', marginBottom: 12 },

  tasksRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  taskPill: {
    width: 74,
    height: 74,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card2,
  },
  taskPillIdle: {
    backgroundColor: 'rgba(0,102,255,0.10)',
  },
  taskPillDone: {
    backgroundColor: 'rgba(0,102,255,0.35)',
    borderColor: 'rgba(0,102,255,0.55)',
  },
  taskPillLocked: { opacity: 0.70 },

  taskInnerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: COLORS.limeSoft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNum: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  taskCheckmark: { 
    color: COLORS.lime, 
    fontSize: 28, 
    fontWeight: '900',
    lineHeight: 32,
  },

  queenCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  queenImg: { width: 160, height: 160 },
  queenRight: { flex: 1, justifyContent: 'center' },
  queenText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },

  limeBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  limeBtnText: { color: '#0E0F0B', fontSize: 18, fontWeight: '900' },

  countdown: {
    marginTop: 12,
    color: COLORS.lime,
    fontSize: 30,
    fontWeight: '900',
    alignSelf: 'flex-end',
  },

  // Quiz Card
  quizCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    borderRadius: 16,
    padding: 14,
  },
  quizTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  quizSub: {
    color: COLORS.dim,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  quizStartBtn: {
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  quizStartBtnDisabled: {
    opacity: 0.4,
  },
  quizStartBtnText: {
    color: '#0E0F0B',
    fontSize: 16,
    fontWeight: '900',
  },

  // Quiz Modal
  quizModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  quizModalCard: {
    width: '98%',
    maxWidth: 480,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: withAlpha(COLORS.lime, 0.65),
    overflow: 'hidden',
    shadowColor: COLORS.lime,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    maxHeight: '85%',
  },
  quizModalContent: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
    maxHeight: '90%',
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  quizModalTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  quizTimer: {
    backgroundColor: COLORS.lime,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  quizTimerWarning: {
    backgroundColor: '#FF0000',
  },
  quizTimerText: {
    color: '#0E0F0B',
    fontSize: 18,
    fontWeight: '900',
  },
  quizScore: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -8,
  },
  quizQuestionCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    marginTop: 8,
  },
  quizQuestionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  quizAnswersContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  quizAnswerBtn: {
    width: '100%',
    backgroundColor: COLORS.card2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.limeSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizAnswerBtnSelected: {
    borderColor: COLORS.lime,
    backgroundColor: 'rgba(0,102,255,0.25)',
  },
  quizAnswerBtnCorrect: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0,255,0,0.15)',
  },
  quizAnswerBtnWrong: {
    borderColor: '#FF0000',
    backgroundColor: 'rgba(255,0,0,0.15)',
  },
  quizAnswerBtnDisabled: {
    opacity: 0.5,
  },
  quizAnswerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  quizAnswerMark: {
    color: '#00FF00',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12,
  },
  quizAnswerMarkWrong: {
    color: '#FF0000',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12,
  },
  quizInfoCard: {
    width: '100%',
    backgroundColor: COLORS.lime,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    marginTop: 8,
  },
  quizInfoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  quizNextBtn: {
    width: '100%',
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
    marginTop: 8,
  },
  quizNextBtnText: {
    color: '#0E0F0B',
    fontSize: 16,
    fontWeight: '900',
  },
  quizFinalScore: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  quizFinalMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  quizModalButtons: {
    width: '100%',
    marginTop: 4,
    alignItems: 'center',
    gap: 12,
  },
  quizModalBtn: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.lime,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizModalBtnClose: {
    backgroundColor: 'rgba(0,102,255,0.18)',
    borderColor: COLORS.limeSoft,
  },
  quizModalBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  bottomPad: { height: 90 },
});
