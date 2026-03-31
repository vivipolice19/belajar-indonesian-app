export interface Word {
  id: number;
  indonesian: string;
  japanese: string;
  category?: string;
  requiredLevel: number;
}

export interface Sentence {
  id: number;
  indonesian: string;
  japanese: string;
  requiredLevel: number;
  category?: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastLoginDate: string;
  lastBonusDate: string;
  wordsLearned: number[];
  wordsPronounced: number[];
  sentencesLearned: number[];
  sentencesPronounced: number[];
  quizzesCompleted: number;
  totalWordsStudied: number;
  dailyMissionCompleted: boolean;
  dailyMissionRewarded: boolean;
  dailyMissionRewardPending: boolean;
  dailyWordsLearned: number[];
  dailyMissionWords: number[];
  lastDailyMissionDate: string;
}

export interface QuizQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
}

export interface SentenceQuizQuestion {
  sentence: Sentence;
  options: string[];
  correctAnswer: string;
}

export interface GameSession {
  score: number;
  timeLeft: number;
  isActive: boolean;
}

export const WORDS_DATA: Word[] = [
  // レベル1: 基本の挨拶（5単語）
  { id: 1, indonesian: "Halo", japanese: "こんにちは", category: "挨拶", requiredLevel: 1 },
  { id: 2, indonesian: "Terima kasih", japanese: "ありがとう", category: "挨拶", requiredLevel: 1 },
  { id: 3, indonesian: "Ya", japanese: "はい", category: "基本", requiredLevel: 1 },
  { id: 4, indonesian: "Tidak", japanese: "いいえ", category: "基本", requiredLevel: 1 },
  { id: 5, indonesian: "Maaf", japanese: "ごめんなさい", category: "挨拶", requiredLevel: 1 },
  
  // レベル2: 挨拶と基本表現（追加10単語 = 計15単語）
  { id: 6, indonesian: "Selamat pagi", japanese: "おはようございます", category: "挨拶", requiredLevel: 2 },
  { id: 7, indonesian: "Selamat malam", japanese: "こんばんは", category: "挨拶", requiredLevel: 2 },
  { id: 8, indonesian: "Permisi", japanese: "すみません", category: "挨拶", requiredLevel: 2 },
  { id: 9, indonesian: "Saya", japanese: "私", category: "基本", requiredLevel: 2 },
  { id: 10, indonesian: "Kamu", japanese: "あなた", category: "基本", requiredLevel: 2 },
  { id: 11, indonesian: "Tolong", japanese: "お願いします", category: "挨拶", requiredLevel: 2 },
  { id: 12, indonesian: "Iya", japanese: "ええ", category: "基本", requiredLevel: 2 },
  { id: 13, indonesian: "Baik", japanese: "良い", category: "基本", requiredLevel: 2 },
  { id: 14, indonesian: "Bagus", japanese: "素晴らしい", category: "基本", requiredLevel: 2 },
  { id: 15, indonesian: "Sama-sama", japanese: "どういたしまして", category: "挨拶", requiredLevel: 2 },
  
  // レベル3: 日常会話と数字（追加10単語 = 計25単語）
  { id: 16, indonesian: "Apa kabar?", japanese: "元気ですか？", category: "挨拶", requiredLevel: 3 },
  { id: 17, indonesian: "Baik-baik saja", japanese: "元気です", category: "挨拶", requiredLevel: 3 },
  { id: 18, indonesian: "Air", japanese: "水", category: "飲食", requiredLevel: 3 },
  { id: 19, indonesian: "Nasi", japanese: "ご飯", category: "飲食", requiredLevel: 3 },
  { id: 20, indonesian: "Satu", japanese: "一", category: "数字", requiredLevel: 3 },
  { id: 21, indonesian: "Dua", japanese: "二", category: "数字", requiredLevel: 3 },
  { id: 22, indonesian: "Tiga", japanese: "三", category: "数字", requiredLevel: 3 },
  { id: 23, indonesian: "Empat", japanese: "四", category: "数字", requiredLevel: 3 },
  { id: 24, indonesian: "Lima", japanese: "五", category: "数字", requiredLevel: 3 },
  { id: 25, indonesian: "Kopi", japanese: "コーヒー", category: "飲食", requiredLevel: 3 },
  
  // レベル4: 家族と色（追加10単語 = 計35単語）
  { id: 26, indonesian: "Ibu", japanese: "母", category: "家族", requiredLevel: 4 },
  { id: 27, indonesian: "Ayah", japanese: "父", category: "家族", requiredLevel: 4 },
  { id: 28, indonesian: "Kakak", japanese: "兄・姉", category: "家族", requiredLevel: 4 },
  { id: 29, indonesian: "Adik", japanese: "弟・妹", category: "家族", requiredLevel: 4 },
  { id: 30, indonesian: "Anak", japanese: "子供", category: "家族", requiredLevel: 4 },
  { id: 31, indonesian: "Merah", japanese: "赤", category: "色", requiredLevel: 4 },
  { id: 32, indonesian: "Biru", japanese: "青", category: "色", requiredLevel: 4 },
  { id: 33, indonesian: "Kuning", japanese: "黄色", category: "色", requiredLevel: 4 },
  { id: 34, indonesian: "Hijau", japanese: "緑", category: "色", requiredLevel: 4 },
  { id: 35, indonesian: "Putih", japanese: "白", category: "色", requiredLevel: 4 },
  
  // レベル5: 動物と体（追加10単語 = 計45単語）
  { id: 36, indonesian: "Kucing", japanese: "猫", category: "動物", requiredLevel: 5 },
  { id: 37, indonesian: "Anjing", japanese: "犬", category: "動物", requiredLevel: 5 },
  { id: 38, indonesian: "Burung", japanese: "鳥", category: "動物", requiredLevel: 5 },
  { id: 39, indonesian: "Ikan", japanese: "魚", category: "動物", requiredLevel: 5 },
  { id: 40, indonesian: "Mata", japanese: "目", category: "体", requiredLevel: 5 },
  { id: 41, indonesian: "Tangan", japanese: "手", category: "体", requiredLevel: 5 },
  { id: 42, indonesian: "Kaki", japanese: "足", category: "体", requiredLevel: 5 },
  { id: 43, indonesian: "Kepala", japanese: "頭", category: "体", requiredLevel: 5 },
  { id: 44, indonesian: "Mulut", japanese: "口", category: "体", requiredLevel: 5 },
  { id: 45, indonesian: "Hidung", japanese: "鼻", category: "体", requiredLevel: 5 },
  
  // レベル6: 天気と時間（追加10単語 = 計55単語）
  { id: 46, indonesian: "Panas", japanese: "暑い", category: "天気", requiredLevel: 1 },
  { id: 47, indonesian: "Dingin", japanese: "寒い", category: "天気", requiredLevel: 1 },
  { id: 48, indonesian: "Hujan", japanese: "雨", category: "天気", requiredLevel: 1 },
  { id: 49, indonesian: "Cerah", japanese: "晴れ", category: "天気", requiredLevel: 1 },
  { id: 50, indonesian: "Hari", japanese: "日", category: "時間", requiredLevel: 1 },
  { id: 51, indonesian: "Minggu", japanese: "週", category: "時間", requiredLevel: 1 },
  { id: 52, indonesian: "Bulan", japanese: "月", category: "時間", requiredLevel: 1 },
  { id: 53, indonesian: "Tahun", japanese: "年", category: "時間", requiredLevel: 1 },
  { id: 54, indonesian: "Pagi", japanese: "朝", category: "時間", requiredLevel: 1 },
  { id: 55, indonesian: "Malam", japanese: "夜", category: "時間", requiredLevel: 1 },
  
  // 食べ物・飲み物（15単語 = 計70単語）
  { id: 56, indonesian: "Teh", japanese: "お茶", category: "飲食", requiredLevel: 1 },
  { id: 57, indonesian: "Susu", japanese: "牛乳", category: "飲食", requiredLevel: 1 },
  { id: 58, indonesian: "Roti", japanese: "パン", category: "飲食", requiredLevel: 1 },
  { id: 59, indonesian: "Telur", japanese: "卵", category: "飲食", requiredLevel: 1 },
  { id: 60, indonesian: "Daging", japanese: "肉", category: "飲食", requiredLevel: 1 },
  { id: 61, indonesian: "Ayam", japanese: "鶏肉", category: "飲食", requiredLevel: 1 },
  { id: 62, indonesian: "Sayur", japanese: "野菜", category: "飲食", requiredLevel: 1 },
  { id: 63, indonesian: "Buah", japanese: "果物", category: "飲食", requiredLevel: 1 },
  { id: 64, indonesian: "Pisang", japanese: "バナナ", category: "飲食", requiredLevel: 1 },
  { id: 65, indonesian: "Apel", japanese: "リンゴ", category: "飲食", requiredLevel: 1 },
  { id: 66, indonesian: "Jeruk", japanese: "オレンジ", category: "飲食", requiredLevel: 1 },
  { id: 67, indonesian: "Gula", japanese: "砂糖", category: "飲食", requiredLevel: 1 },
  { id: 68, indonesian: "Garam", japanese: "塩", category: "飲食", requiredLevel: 1 },
  { id: 69, indonesian: "Mie", japanese: "麺", category: "飲食", requiredLevel: 1 },
  { id: 70, indonesian: "Jus", japanese: "ジュース", category: "飲食", requiredLevel: 1 },
  
  // 場所・建物（15単語 = 計85単語）
  { id: 71, indonesian: "Rumah", japanese: "家", category: "場所", requiredLevel: 1 },
  { id: 72, indonesian: "Sekolah", japanese: "学校", category: "場所", requiredLevel: 1 },
  { id: 73, indonesian: "Kantor", japanese: "会社・オフィス", category: "場所", requiredLevel: 1 },
  { id: 74, indonesian: "Toko", japanese: "店", category: "場所", requiredLevel: 1 },
  { id: 75, indonesian: "Pasar", japanese: "市場", category: "場所", requiredLevel: 1 },
  { id: 76, indonesian: "Restoran", japanese: "レストラン", category: "場所", requiredLevel: 1 },
  { id: 77, indonesian: "Hotel", japanese: "ホテル", category: "場所", requiredLevel: 1 },
  { id: 78, indonesian: "Bank", japanese: "銀行", category: "場所", requiredLevel: 1 },
  { id: 79, indonesian: "Rumah sakit", japanese: "病院", category: "場所", requiredLevel: 1 },
  { id: 80, indonesian: "Stasiun", japanese: "駅", category: "場所", requiredLevel: 1 },
  { id: 81, indonesian: "Bandara", japanese: "空港", category: "場所", requiredLevel: 1 },
  { id: 82, indonesian: "Jalan", japanese: "道", category: "場所", requiredLevel: 1 },
  { id: 83, indonesian: "Kota", japanese: "都市", category: "場所", requiredLevel: 1 },
  { id: 84, indonesian: "Desa", japanese: "村", category: "場所", requiredLevel: 1 },
  { id: 85, indonesian: "Pantai", japanese: "ビーチ", category: "場所", requiredLevel: 1 },
  
  // 動詞（20単語 = 計105単語）
  { id: 86, indonesian: "Makan", japanese: "食べる", category: "動詞", requiredLevel: 1 },
  { id: 87, indonesian: "Minum", japanese: "飲む", category: "動詞", requiredLevel: 1 },
  { id: 88, indonesian: "Tidur", japanese: "寝る", category: "動詞", requiredLevel: 1 },
  { id: 89, indonesian: "Bangun", japanese: "起きる", category: "動詞", requiredLevel: 1 },
  { id: 90, indonesian: "Pergi", japanese: "行く", category: "動詞", requiredLevel: 1 },
  { id: 91, indonesian: "Datang", japanese: "来る", category: "動詞", requiredLevel: 1 },
  { id: 92, indonesian: "Belajar", japanese: "勉強する", category: "動詞", requiredLevel: 1 },
  { id: 93, indonesian: "Bekerja", japanese: "働く", category: "動詞", requiredLevel: 1 },
  { id: 94, indonesian: "Bermain", japanese: "遊ぶ", category: "動詞", requiredLevel: 1 },
  { id: 95, indonesian: "Membaca", japanese: "読む", category: "動詞", requiredLevel: 1 },
  { id: 96, indonesian: "Menulis", japanese: "書く", category: "動詞", requiredLevel: 1 },
  { id: 97, indonesian: "Mendengar", japanese: "聞く", category: "動詞", requiredLevel: 1 },
  { id: 98, indonesian: "Melihat", japanese: "見る", category: "動詞", requiredLevel: 1 },
  { id: 99, indonesian: "Berbicara", japanese: "話す", category: "動詞", requiredLevel: 1 },
  { id: 100, indonesian: "Mengerti", japanese: "理解する", category: "動詞", requiredLevel: 1 },
  { id: 101, indonesian: "Membeli", japanese: "買う", category: "動詞", requiredLevel: 1 },
  { id: 102, indonesian: "Menjual", japanese: "売る", category: "動詞", requiredLevel: 1 },
  { id: 103, indonesian: "Mencari", japanese: "探す", category: "動詞", requiredLevel: 1 },
  { id: 104, indonesian: "Memasak", japanese: "料理する", category: "動詞", requiredLevel: 1 },
  { id: 105, indonesian: "Menunggu", japanese: "待つ", category: "動詞", requiredLevel: 1 },
  
  // 形容詞（20単語 = 計125単語）
  { id: 106, indonesian: "Besar", japanese: "大きい", category: "形容詞", requiredLevel: 1 },
  { id: 107, indonesian: "Kecil", japanese: "小さい", category: "形容詞", requiredLevel: 1 },
  { id: 108, indonesian: "Tinggi", japanese: "高い", category: "形容詞", requiredLevel: 1 },
  { id: 109, indonesian: "Rendah", japanese: "低い", category: "形容詞", requiredLevel: 1 },
  { id: 110, indonesian: "Panjang", japanese: "長い", category: "形容詞", requiredLevel: 1 },
  { id: 111, indonesian: "Pendek", japanese: "短い", category: "形容詞", requiredLevel: 1 },
  { id: 112, indonesian: "Luas", japanese: "広い", category: "形容詞", requiredLevel: 1 },
  { id: 113, indonesian: "Sempit", japanese: "狭い", category: "形容詞", requiredLevel: 1 },
  { id: 114, indonesian: "Tebal", japanese: "厚い", category: "形容詞", requiredLevel: 1 },
  { id: 115, indonesian: "Tipis", japanese: "薄い", category: "形容詞", requiredLevel: 1 },
  { id: 116, indonesian: "Berat", japanese: "重い", category: "形容詞", requiredLevel: 1 },
  { id: 117, indonesian: "Ringan", japanese: "軽い", category: "形容詞", requiredLevel: 1 },
  { id: 118, indonesian: "Cepat", japanese: "速い", category: "形容詞", requiredLevel: 1 },
  { id: 119, indonesian: "Lambat", japanese: "遅い", category: "形容詞", requiredLevel: 1 },
  { id: 120, indonesian: "Baru", japanese: "新しい", category: "形容詞", requiredLevel: 1 },
  { id: 121, indonesian: "Lama", japanese: "古い", category: "形容詞", requiredLevel: 1 },
  { id: 122, indonesian: "Muda", japanese: "若い", category: "形容詞", requiredLevel: 1 },
  { id: 123, indonesian: "Tua", japanese: "年老いた", category: "形容詞", requiredLevel: 1 },
  { id: 124, indonesian: "Cantik", japanese: "美しい", category: "形容詞", requiredLevel: 1 },
  { id: 125, indonesian: "Jelek", japanese: "醜い", category: "形容詞", requiredLevel: 1 },
  
  // 感情・状態（15単語 = 計140単語）
  { id: 126, indonesian: "Senang", japanese: "嬉しい", category: "感情", requiredLevel: 1 },
  { id: 127, indonesian: "Sedih", japanese: "悲しい", category: "感情", requiredLevel: 1 },
  { id: 128, indonesian: "Marah", japanese: "怒っている", category: "感情", requiredLevel: 1 },
  { id: 129, indonesian: "Takut", japanese: "怖い", category: "感情", requiredLevel: 1 },
  { id: 130, indonesian: "Lelah", japanese: "疲れた", category: "感情", requiredLevel: 1 },
  { id: 131, indonesian: "Lapar", japanese: "お腹が空いた", category: "感情", requiredLevel: 1 },
  { id: 132, indonesian: "Haus", japanese: "喉が渇いた", category: "感情", requiredLevel: 1 },
  { id: 133, indonesian: "Kenyang", japanese: "お腹いっぱい", category: "感情", requiredLevel: 1 },
  { id: 134, indonesian: "Sakit", japanese: "痛い", category: "感情", requiredLevel: 1 },
  { id: 135, indonesian: "Sehat", japanese: "健康", category: "感情", requiredLevel: 1 },
  { id: 136, indonesian: "Sibuk", japanese: "忙しい", category: "感情", requiredLevel: 1 },
  { id: 137, indonesian: "Bosan", japanese: "退屈", category: "感情", requiredLevel: 1 },
  { id: 138, indonesian: "Kaget", japanese: "びっくり", category: "感情", requiredLevel: 1 },
  { id: 139, indonesian: "Heran", japanese: "不思議", category: "感情", requiredLevel: 1 },
  { id: 140, indonesian: "Malu", japanese: "恥ずかしい", category: "感情", requiredLevel: 1 },
  
  // 交通・その他（10単語 = 計150単語）
  { id: 141, indonesian: "Mobil", japanese: "車", category: "交通", requiredLevel: 1 },
  { id: 142, indonesian: "Motor", japanese: "バイク", category: "交通", requiredLevel: 1 },
  { id: 143, indonesian: "Sepeda", japanese: "自転車", category: "交通", requiredLevel: 1 },
  { id: 144, indonesian: "Bus", japanese: "バス", category: "交通", requiredLevel: 1 },
  { id: 145, indonesian: "Kereta", japanese: "電車", category: "交通", requiredLevel: 1 },
  { id: 146, indonesian: "Pesawat", japanese: "飛行機", category: "交通", requiredLevel: 1 },
  { id: 147, indonesian: "Kapal", japanese: "船", category: "交通", requiredLevel: 1 },
  { id: 148, indonesian: "Uang", japanese: "お金", category: "基本", requiredLevel: 1 },
  { id: 149, indonesian: "Buku", japanese: "本", category: "基本", requiredLevel: 1 },
  { id: 150, indonesian: "Handuk", japanese: "タオル", category: "基本", requiredLevel: 1 },
];

export const SENTENCES_DATA: Sentence[] = [
  { id: 1, indonesian: "Saya suka kopi.", japanese: "私はコーヒーが好きです。", requiredLevel: 1, category: "日常会話" },
  { id: 2, indonesian: "Nama saya Tanaka.", japanese: "私の名前は田中です。", requiredLevel: 1, category: "自己紹介" },
  { id: 3, indonesian: "Saya dari Jepang.", japanese: "私は日本出身です。", requiredLevel: 1, category: "自己紹介" },
  { id: 4, indonesian: "Apa kabar hari ini?", japanese: "今日はお元気ですか？", requiredLevel: 1, category: "挨拶" },
  { id: 5, indonesian: "Saya mau makan nasi.", japanese: "私はご飯を食べたいです。", requiredLevel: 1, category: "飲食" },
  { id: 6, indonesian: "Terima kasih banyak.", japanese: "どうもありがとうございます。", requiredLevel: 1, category: "挨拶" },
  { id: 7, indonesian: "Saya tidak mengerti.", japanese: "私は理解できません。", requiredLevel: 1, category: "日常会話" },
  { id: 8, indonesian: "Di mana toilet?", japanese: "トイレはどこですか？", requiredLevel: 1, category: "質問" },
  { id: 9, indonesian: "Berapa harganya?", japanese: "いくらですか？", requiredLevel: 1, category: "買い物" },
  { id: 10, indonesian: "Saya sedang belajar bahasa Indonesia.", japanese: "私はインドネシア語を勉強しています。", requiredLevel: 1, category: "日常会話" },
  { id: 11, indonesian: "Boleh saya minta air?", japanese: "水をいただけますか？", requiredLevel: 1, category: "飲食" },
  { id: 12, indonesian: "Saya ingin pergi ke Jakarta.", japanese: "私はジャカルタに行きたいです。", requiredLevel: 1, category: "旅行" },
  { id: 13, indonesian: "Tolong bicara pelan-pelan.", japanese: "ゆっくり話してください。", requiredLevel: 1, category: "質問" },
  { id: 14, indonesian: "Saya senang bertemu dengan kamu.", japanese: "あなたに会えて嬉しいです。", requiredLevel: 1, category: "挨拶" },
  { id: 15, indonesian: "Sampai jumpa lagi!", japanese: "また会いましょう！", requiredLevel: 1, category: "挨拶" },
  { id: 16, indonesian: "Saya lapar.", japanese: "私はお腹が空いています。", requiredLevel: 1, category: "日常会話" },
  { id: 17, indonesian: "Saya haus.", japanese: "私は喉が渇いています。", requiredLevel: 1, category: "日常会話" },
  { id: 18, indonesian: "Ini berapa?", japanese: "これはいくらですか？", requiredLevel: 1, category: "買い物" },
  { id: 19, indonesian: "Saya mau ini.", japanese: "これが欲しいです。", requiredLevel: 1, category: "買い物" },
  { id: 20, indonesian: "Kamu mau apa?", japanese: "何が欲しいですか？", requiredLevel: 1, category: "日常会話" },
  { id: 21, indonesian: "Saya bekerja di kantor.", japanese: "私は会社で働いています。", requiredLevel: 1, category: "仕事" },
  { id: 22, indonesian: "Dia guru sekolah.", japanese: "彼は学校の先生です。", requiredLevel: 1, category: "職業" },
  { id: 23, indonesian: "Hari ini panas sekali.", japanese: "今日はとても暑いです。", requiredLevel: 1, category: "天気" },
  { id: 24, indonesian: "Besok hujan.", japanese: "明日は雨です。", requiredLevel: 1, category: "天気" },
  { id: 25, indonesian: "Jam berapa sekarang?", japanese: "今何時ですか？", requiredLevel: 1, category: "時間" },
  { id: 26, indonesian: "Sekarang jam delapan.", japanese: "今8時です。", requiredLevel: 1, category: "時間" },
  { id: 27, indonesian: "Saya pergi ke sekolah.", japanese: "私は学校に行きます。", requiredLevel: 1, category: "日常会話" },
  { id: 28, indonesian: "Dia datang dari Bali.", japanese: "彼はバリから来ました。", requiredLevel: 1, category: "旅行" },
  { id: 29, indonesian: "Kami makan di restoran.", japanese: "私たちはレストランで食べます。", requiredLevel: 1, category: "飲食" },
  { id: 30, indonesian: "Mereka bermain di taman.", japanese: "彼らは公園で遊んでいます。", requiredLevel: 1, category: "日常会話" },
  { id: 31, indonesian: "Saya suka membaca buku.", japanese: "私は本を読むのが好きです。", requiredLevel: 1, category: "趣味" },
  { id: 32, indonesian: "Dia bisa berbicara bahasa Inggris.", japanese: "彼は英語を話せます。", requiredLevel: 1, category: "言語" },
  { id: 33, indonesian: "Saya tidak bisa berenang.", japanese: "私は泳げません。", requiredLevel: 1, category: "能力" },
  { id: 34, indonesian: "Kamu tinggal di mana?", japanese: "どこに住んでいますか？", requiredLevel: 1, category: "質問" },
  { id: 35, indonesian: "Saya tinggal di Tokyo.", japanese: "私は東京に住んでいます。", requiredLevel: 1, category: "自己紹介" },
  { id: 36, indonesian: "Tolong bantu saya.", japanese: "手伝ってください。", requiredLevel: 1, category: "依頼" },
  { id: 37, indonesian: "Ini enak sekali!", japanese: "これはとても美味しいです！", requiredLevel: 1, category: "飲食" },
  { id: 38, indonesian: "Saya lelah.", japanese: "私は疲れています。", requiredLevel: 1, category: "感情" },
  { id: 39, indonesian: "Kamu cantik.", japanese: "あなたは美しいです。", requiredLevel: 1, category: "褒め言葉" },
  { id: 40, indonesian: "Selamat ulang tahun!", japanese: "誕生日おめでとう！", requiredLevel: 1, category: "挨拶" },
];

export const XP_PER_LEVEL = 100;
export const LEVEL_UP_MULTIPLIER = 1.5;

export function getXPForNextLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_UP_MULTIPLIER, level - 1));
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;
  
  while (totalXP + getXPForNextLevel(level) <= xp) {
    totalXP += getXPForNextLevel(level);
    level++;
  }
  
  return level;
}

export function getXPProgressInCurrentLevel(xp: number, level: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += getXPForNextLevel(i);
  }
  
  const current = xp - totalXP;
  const needed = getXPForNextLevel(level);
  const percentage = (current / needed) * 100;
  
  return { current, needed, percentage };
}
