import { useGameStore } from '@/stores/gameStore'

export const translations = {
    tr: {
        tutorial: {
            welcome: "Brain Spark Sudoku'ya hoş geldin! Hadi nasıl oynandığına hızlıca bakalım.",
            goal: "Amacın 9x9 luk alanı sayılarla doldurmak. Ancak her satır, her sütun ve her 3x3 lük blokta 1'den 9'a kadar sayılar yalnızca BİR kez kullanılabilir!",
            pencil: "Emin olmadığın durumlarda Not (Kalem) modunu açarak hücrelere küçük ihtimaller yazabilirsin. Mantık yürütmek için harikadır!",
            lives: "Dikkat et, kural dışı veya hatalı bir sayı yerleştirdiğinde Can kaybedersin. 3 defa hata yaparsan oyun biter. Bol şans!",
            back: "Geri",
            close: "Kapat",
            last: "Anladım!",
            next: "İleri",
            skip: "Geç"
        },
        settings: {
            title: "Ayarlar",
            general: "Genel Ayarlar",
            viewButton: "Görüntüle",
            language: "Dil",
            privacyPolicy: "Gizlilik Politikası",
            music: "Müzik",
            sound: "Ses Efektleri",
            vibration: "Titreşim (Haptics)",
            gameplay: "Oyun İçi Ayarlar",
            errorHighlight: "Hata Vurgulama",
            darkMode: "Karanlık Mod (Dark)",
            fontSize: "Font Boyutu",
            fontSizeSmall: "Küçük",
            fontSizeMedium: "Orta",
            fontSizeLarge: "Büyük",
            others: "Diğer",
            restorePurchases: "Satın Alımları Geri Yükle",
            restoreButton: "Geri Yükle",
            restoreAlert: "Satın alım kontrol edildi."
        },
        game: {
            paused: "Oyun Duraklatıldı",
            pauseMessage: "İlerlemeniz otomatik olarak kaydedildi. Menüye dönmek veya devam etmek ister misiniz?",
            resume: "▶ Devam Et",
            menu: "🏠 Ana Menü",
            exitTitle: "Menüye Dönülsün mü?",
            exitMessage: "Mevcut oyununuz kaydedilecek. Daha sonra devam edebilirsiniz.",
            exitConfirm: "Evet, Çık",
            exitCancel: "Hayır, Kal",
            gameOver: "Oyun Bitti",
            gameOverMessage: "Tüm canlarını tükettin.",
            revive: "🎥 İzle & Devam Et",
            restart: "🔄 Yeniden Başla",
            adFailed: "Reklam yüklenemedi.",
            pesEtmekYok: "Pes etmek yok!",
            chapter: "Bölüm",
            chapters: "Bölümler",
            easy: "Kolay",
            medium: "Orta",
            hard: "Zor",
            erase: "Sil",
            note: "Not",
            hint: "İpucu",
            excellent: "Mükemmel!",
            time: "Süre",
            mistakes: "Hata",
            nextLevel: "Sonraki Bölüm ⏭️",
            selectCellToHint: "İpucu almak için önce boş bir hücre seçin.",
            daily: "Günün Görevi",
            hintModalTitle: "İpucu Gerekli mi?",
            hintModalDesc: "Zekânı konuşturmaya devam et! Yolunu aydınlatmak için bir ipucu seç.",
            watchAdLabel: "İzle İpucu Al 🎥",
            spendCoinsLabel: "5 Coin 💎",
            noCoinsWarning: "Yeterli coinin yok! Reklam izleyerek ücretsiz ipucu alabilirsin.",
            adCancelled: "Reklam yarıda kesildi, ödül alınamadı.",
            adNotReady: "Reklam henüz hazır değil, lütfen birkaç saniye sonra tekrar deneyin.",
            balance: "Bakiye",
            ok: "Tamam"
        },
        levels: {
            title: "Zorluk Seçimi",
            easyDesc: "Sakin ve Odaklanmış",
            mediumDesc: "Zihni Isıtan Zorluk",
            hardDesc: "Gerçek Dâhiler İçin"
        },
        howto: {
            title: "Nasıl Oynanır?",
            logicTitle: "Mantığı Anla",
            logicDesc: "Her satır, her sütun ve her kalın çizgili 3x3 kutuda 1'den 9'a kadar sayılar 1 kez bulunmalı.",
            noteTitle: "Adayları İşaretle",
            noteDesc: "Emin olamadığın yerlere kalem modunu açıp not bırakarak ihtimalleri daralt.",
            limitTitle: "Sınırlarını Bil",
            limitDesc: "Oyun boyunca 3 kez hata yapma lüksün var. Bitince oyun sona erer.",
            streakTitle: "Seri Yakala",
            streakDesc: "Her gün oynayıp alev serini artır. Dünya saatine karşı yarış!",
            interactive: "🎮 İnteraktif Öğreticiyi Başlat",
            adventure: "Maceraya Başla 🚀"
        },
        home: {
            subtitle: "Zihninizi Zorlayan Sudoku",
            resume: "▶ Kaldığın Yerden",
            newGame: "🎮 Yeni Oyun",
            dailyChallenge: "Günün\nGörevi",
            tutorial: "Öğretici",
            settings: "Ayarlar"
        },
        daily: {
            title: "Günlük Görev",
            puzzleTitle: "Günün Bulmacası",
            streakLabel: "Günlük Seri",
            resetLabel: "Yenilenme",
            claimedMessage: "Bugünkü ödülü zaten aldın!",
            startChallenge: "Göreve Başla 🚀",
            footerNote: "Günlük bulmaca internet saatine (WorldTimeAPI) duyarlıdır, hile yapılamaz.",
            locale: 'tr-TR'
        }
    },
    en: {
        tutorial: {
            welcome: "Welcome to Brain Spark Sudoku! Let's take a quick look at how to play.",
            goal: "Your goal is to fill the 9x9 area with numbers. However, numbers from 1 to 9 can only be used ONCE in each row, each column, and each 3x3 block!",
            pencil: "In cases where you are not sure, you can open Note (Pencil) mode and write small probabilities into the cells. Great for reasoning!",
            lives: "Be careful, you lose a Heart when you place an invalid or incorrect number. The game ends if you make 3 mistakes. Good luck!",
            back: "Back",
            close: "Close",
            last: "Got it!",
            next: "Next",
            skip: "Skip"
        },
        settings: {
            title: "Settings",
            general: "General Settings",
            viewButton: "View",
            language: "Language",
            privacyPolicy: "Privacy Policy",
            music: "Music",
            sound: "Sound Effects",
            vibration: "Vibration (Haptics)",
            gameplay: "In-Game Settings",
            errorHighlight: "Error Highlighting",
            darkMode: "Dark Mode",
            fontSize: "Font Size",
            fontSizeSmall: "Small",
            fontSizeMedium: "Medium",
            fontSizeLarge: "Large",
            others: "Others",
            restorePurchases: "Restore Purchases",
            restoreButton: "Restore",
            restoreAlert: "Purchases restored."
        },
        game: {
            paused: "Game Paused",
            pauseMessage: "Your progress has been saved automatically. Do you want to return to the menu or continue?",
            resume: "▶ Continue",
            menu: "🏠 Main Menu",
            exitTitle: "Return to Menu?",
            exitMessage: "Your current game will be saved. You can continue later.",
            exitConfirm: "Yes, Exit",
            exitCancel: "No, Stay",
            gameOver: "Game Over",
            gameOverMessage: "You've run out of lives.",
            revive: "🎥 Watch & Continue",
            restart: "🔄 Restart",
            adFailed: "Ad failed to load.",
            pesEtmekYok: "Never give up!",
            chapter: "Chapter",
            chapters: "Chapters",
            easy: "Easy",
            medium: "Medium",
            hard: "Hard",
            erase: "Erase",
            note: "Note",
            hint: "Hint",
            excellent: "Excellent!",
            time: "Time",
            mistakes: "Mistakes",
            nextLevel: "Next Level ⏭️",
            selectCellToHint: "Select an empty cell first to get a hint.",
            daily: "Daily Challenge",
            hintModalTitle: "Need a Hint?",
            hintModalDesc: "Keep your brilliance shining! Choose a hint to light your path.",
            watchAdLabel: "Watch & Get Hint 🎥",
            spendCoinsLabel: "5 Coins 💎",
            noCoinsWarning: "Not enough coins! You can get a free hint by watching an ad.",
            adCancelled: "Ad was not finished, no reward given.",
            adNotReady: "Ad is not ready yet, please try again in a few seconds.",
            balance: "Balance",
            ok: "OK"
        },
        levels: {
            title: "Difficulty Selection",
            easyDesc: "Calm and Focused",
            mediumDesc: "Mind-Warming Difficulty",
            hardDesc: "For Real Geniuses"
        },
        howto: {
            title: "How to Play?",
            logicTitle: "Understand the Logic",
            logicDesc: "Each row, each column, and each 3x3 block must contain the numbers 1 to 9 exactly once.",
            noteTitle: "Mark Candidates",
            noteDesc: "Narrow down the possibilities by switching to note mode and leaving notes in places you're not sure about.",
            limitTitle: "Know your Limits",
            limitDesc: "You have 3 mistakes allowed during the game. Once they're gone, the game ends.",
            streakTitle: "Get a Streak",
            streakDesc: "Play every day to increase your streak. Race against the global clock!",
            interactive: "🎮 Start Interactive Tutorial",
            adventure: "Start the Adventure 🚀"
        },
        home: {
            subtitle: "Mind-Bending Sudoku",
            resume: "▶ Resume Game",
            newGame: "🎮 New Game",
            dailyChallenge: "Daily\nChallenge",
            tutorial: "Tutorial",
            settings: "Settings"
        },
        daily: {
            title: "Daily Challenge",
            puzzleTitle: "Daily Puzzle",
            streakLabel: "Daily Streak",
            resetLabel: "Resets In",
            claimedMessage: "You have already claimed today's reward!",
            startChallenge: "Start Challenge 🚀",
            footerNote: "Daily challenge is sensitive to world time (WorldTimeAPI), anti-cheat enabled.",
            locale: 'en-US'
        }
    }
}

export type TranslationKey = typeof translations.tr

export function useTranslation() {
    const language = useGameStore(state => state.settings.language) as 'tr' | 'en'
    const t = translations[language] || translations.en

    return { t, language }
}
