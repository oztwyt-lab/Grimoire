// ─── src/i18n/strings.ts ─────────────────────────────────────────────────────
// All UI strings for English and Turkish.
// Add new keys here first, then use t('key') in components.

export type Language = 'en' | 'tr';

export const strings = {
  en: {
    // ─── Login ───────────────────────────────────────────────────────────
    login_title: 'LOG IN',
    login_email: 'Email',
    login_password: 'Password',
    login_signing_in: 'SIGNING IN...',
    login_sign_in: 'SIGN IN',
    login_create_account: 'Create an account',
    login_failed_title: 'Login failed',
    login_failed_msg: 'Check your email and password and try again.',
    login_lang_en: 'EN',
    login_lang_tr: 'TR',

    // ─── Register ────────────────────────────────────────────────────────
    register_title: 'NEW GAME',
    register_email: 'Email',
    register_password: 'Password',
    register_creating: 'CREATING...',
    register_create: 'CREATE ACCOUNT',
    register_have_account: 'Already have an account?',
    register_failed_title: 'Registration failed',

    // ─── Grimoire ────────────────────────────────────────────────────────
    grimoire_title: 'GRIMOIRE',
    grimoire_subtitle: 'RECIPE COLLECTION',
    grimoire_back: '◀ HOME',
    grimoire_search: 'Search recipes...',
    grimoire_empty_search: 'NO RESULTS FOUND.',
    grimoire_empty_list: 'NO RECIPES YET.\nCREATE YOUR FIRST SPELL.',
    grimoire_recipes: 'RECIPES',
    grimoire_to: 'TO',
    grimoire_new_recipe: '+ NEW RECIPE',

    // ─── Create Recipe ───────────────────────────────────────────────────
    create_title: 'NEW RECIPE',
    create_name_placeholder: 'Recipe name',
    create_ingredients_label: 'INGREDIENTS',
    create_steps_label: 'PREPARATION STEPS',
    create_steps_placeholder: 'Write your steps here...',
    create_saving: 'SAVING...',
    create_save: 'SAVE RECIPE',
    create_cancel: 'Cancel',
    create_missing_name_title: 'Missing name',
    create_missing_name_msg: 'Please give your recipe a name.',
    create_error_title: 'Error',

    // ─── Ingredient Picker ───────────────────────────────────────────────
    picker_title: 'Add Ingredient',
    picker_search: 'Search ingredients...',
    picker_all: 'All',
    picker_custom_button: '+ CUSTOM INGREDIENT',
    picker_ingredient_name: 'Ingredient name',
    picker_quantity: 'Quantity (e.g. 2, 1/2 cup)',
    picker_add: 'Add',
    picker_cancel: 'Cancel',

    // ─── Recipe Detail ───────────────────────────────────────────────────
    detail_back: '◀ BACK',
    detail_edit: 'EDIT',
    detail_delete: 'DELETE',
    detail_ingredients: 'INGREDIENTS',
    detail_preparation: 'PREPARATION',
    detail_not_found: 'Recipe not found.',
    detail_delete_title: 'DELETE RECIPE',
    detail_delete_msg: 'Are you sure? This cannot be undone.',
    detail_delete_cancel: 'Cancel',
    detail_delete_confirm: 'Delete',

    // ─── Edit Recipe ─────────────────────────────────────────────────────
    edit_title: 'EDIT RECIPE',
    edit_name_placeholder: 'Recipe name',
    edit_ingredients_label: 'INGREDIENTS',
    edit_steps_label: 'PREPARATION STEPS',
    edit_steps_placeholder: 'Write your steps here...',
    edit_hint: 'Long press an ingredient to remove it',
    edit_saving: 'SAVING...',
    edit_save: 'SAVE CHANGES',
    edit_cancel: 'Cancel',
    edit_missing_name_title: 'Missing name',
    edit_missing_name_msg: 'Please give your recipe a name.',
    edit_error_title: 'Error',

    // ─── Account ─────────────────────────────────────────────────────────
    account_title: 'ACCOUNT',
    account_signed_in_as: 'SIGNED IN AS',
    account_danger_zone: 'DANGER ZONE',
    account_delete_button: 'DELETE ACCOUNT',
    account_delete_warning: 'This will permanently delete your account and all recipes. Enter your password to confirm.',
    account_password_placeholder: 'Password',
    account_deleting: 'DELETING...',
    account_confirm_delete: 'CONFIRM DELETE',
    account_cancel: 'CANCEL',
    account_back: '◀ BACK',
    account_error_wrong_password: 'Incorrect password.',
    account_error_generic: 'Something went wrong. Try again.',
    account_error_title: 'Error',
rank_apprentice: 'APPRENTICE',
rank_cook: 'COOK',
rank_chef: 'CHEF',
rank_sorcerer: 'SORCERER',
rank_archmage: 'ARCH-MAGE',
flavor_apprentice: 'Still learning the sacred arts...',
flavor_cook: 'The flame obeys your will.',
flavor_chef: 'Your name is spoken in kitchens.',
flavor_sorcerer: 'Ingredients bend to your magic.',
flavor_archmage: 'A legend of the culinary arts.',
    // ─── Home / HUD ──────────────────────────────────────────────────────
    home_grimoire: 'GRIMOIRE',
    home_brew: 'BREW',
    home_account: 'ACCOUNT',
    home_recipes: 'RECIPES',
    home_to: 'TO',
    home_max_rank: 'MAX RANK',

    // ─── Nav tabs ────────────────────────────────────────────────────────
    nav_grimor: 'GRIMOR',
    nav_inventory: 'INVENTORY',
    nav_character: 'CHARACTER',

    // ─── Settings ────────────────────────────────────────────────────────
    settings_title: 'SETTINGS',
    settings_back: '◄ BACK',
    settings_account: 'SIGNED IN AS',
    settings_language: 'LANGUAGE',
    settings_danger: 'DANGER ZONE',
    settings_delete: 'DELETE ACCOUNT',
    lang_english: 'ENGLISH',
    lang_turkish: 'TURKISH',

    // ─── Inventory ───────────────────────────────────────────────────────
    inventory_title: 'INVENTORY',
    inventory_empty: 'No items logged yet',
    inventory_add: 'LOG ITEM',

    // ─── Character ───────────────────────────────────────────────────────
    character_title: 'CHARACTER',
  },

  tr: {
    // ─── Login ───────────────────────────────────────────────────────────
    login_title: 'GİRİŞ YAP',
    login_email: 'E-posta',
    login_password: 'Şifre',
    login_signing_in: 'GİRİŞ YAPILIYOR...',
    login_sign_in: 'GİRİŞ YAP',
    login_create_account: 'Hesap oluştur',
    login_failed_title: 'Giriş başarısız',
    login_failed_msg: 'E-posta ve şifrenizi kontrol edip tekrar deneyin.',
    login_lang_en: 'EN',
    login_lang_tr: 'TR',
rank_apprentice: 'ÇIRAK',
rank_cook: 'AŞÇI',
rank_chef: 'USTA AŞÇI',
rank_sorcerer: 'BÜYÜCÜ',
rank_archmage: 'BÜYÜK ÜSTAD',
flavor_apprentice: 'Kutsal sanatları öğrenmeye devam ediyor...',
flavor_cook: 'Alev artık senin emrinde.',
flavor_chef: 'Adın mutfaklarda fısıldanıyor.',
flavor_sorcerer: 'Malzemeler büyüne boyun eğiyor.',
flavor_archmage: 'Mutfak sanatlarının efsanesi.',
    // ─── Register ────────────────────────────────────────────────────────
    register_title: 'YENİ OYUN',
    register_email: 'E-posta',
    register_password: 'Şifre',
    register_creating: 'OLUŞTURULUYOR...',
    register_create: 'HESAP OLUŞTUR',
    register_have_account: 'Zaten hesabın var mı?',
    register_failed_title: 'Kayıt başarısız',

    // ─── Grimoire ────────────────────────────────────────────────────────
    grimoire_title: 'GRIMOIRE',
    grimoire_subtitle: 'TARİF KOLEKSİYONU',
    grimoire_back: '◀ ANA EKRAN',
    grimoire_search: 'Tarif ara...',
    grimoire_empty_search: 'SONUÇ BULUNAMADI.',
    grimoire_empty_list: 'HENÜ TARİF YOK.\nİLK BÜYÜNİ OLUŞTUR.',
    grimoire_recipes: 'TARİF',
    grimoire_to: 'KALDI',
    grimoire_new_recipe: '+ YENİ TARİF',

    // ─── Create Recipe ───────────────────────────────────────────────────
    create_title: 'YENİ TARİF',
    create_name_placeholder: 'Tarif adı',
    create_ingredients_label: 'MALZEMELER',
    create_steps_label: 'HAZIRLANIŞI',
    create_steps_placeholder: 'Adımları buraya yaz...',
    create_saving: 'KAYDEDİLİYOR...',
    create_save: 'TARİFİ KAYDET',
    create_cancel: 'İptal',
    create_missing_name_title: 'İsim eksik',
    create_missing_name_msg: 'Lütfen tarifinize bir isim verin.',
    create_error_title: 'Hata',

    // ─── Ingredient Picker ───────────────────────────────────────────────
    picker_title: 'Malzeme Ekle',
    picker_search: 'Malzeme ara...',
    picker_all: 'Tümü',
    picker_custom_button: '+ ÖZEL MALZEME',
    picker_ingredient_name: 'Malzeme adı',
    picker_quantity: 'Miktar (örn. 2, 1/2 su bardağı)',
    picker_add: 'Ekle',
    picker_cancel: 'İptal',

    // ─── Recipe Detail ───────────────────────────────────────────────────
    detail_back: '◀ GERİ',
    detail_edit: 'DÜZENLE',
    detail_delete: 'SİL',
    detail_ingredients: 'MALZEMELER',
    detail_preparation: 'HAZIRLANIŞI',
    detail_not_found: 'Tarif bulunamadı.',
    detail_delete_title: 'TARİFİ SİL',
    detail_delete_msg: 'Emin misin? Bu işlem geri alınamaz.',
    detail_delete_cancel: 'İptal',
    detail_delete_confirm: 'Sil',

    // ─── Edit Recipe ─────────────────────────────────────────────────────
    edit_title: 'TARİFİ DÜZENLE',
    edit_name_placeholder: 'Tarif adı',
    edit_ingredients_label: 'MALZEMELER',
    edit_steps_label: 'HAZIRLANIŞI',
    edit_steps_placeholder: 'Adımları buraya yaz...',
    edit_hint: 'Malzemeyi kaldırmak için uzun bas',
    edit_saving: 'KAYDEDİLİYOR...',
    edit_save: 'DEĞİŞİKLİKLERİ KAYDET',
    edit_cancel: 'İptal',
    edit_missing_name_title: 'İsim eksik',
    edit_missing_name_msg: 'Lütfen tarifinize bir isim verin.',
    edit_error_title: 'Hata',

    // ─── Account ─────────────────────────────────────────────────────────
    account_title: 'HESAP',
    account_signed_in_as: 'GİRİŞ YAPILAN HESAP',
    account_danger_zone: 'TEHLİKELİ BÖLGE',
    account_delete_button: 'HESABI SİL',
    account_delete_warning: 'Bu işlem hesabını ve tüm tariflerini kalıcı olarak siler. Onaylamak için şifreni gir.',
    account_password_placeholder: 'Şifre',
    account_deleting: 'SİLİNİYOR...',
    account_confirm_delete: 'SİLMEYİ ONAYLA',
    account_cancel: 'İPTAL',
    account_back: '◀ GERİ',
    account_error_wrong_password: 'Yanlış şifre.',
    account_error_generic: 'Bir şeyler ters gitti. Tekrar dene.',
    account_error_title: 'Hata',

    // ─── Home / HUD ──────────────────────────────────────────────────────
    home_grimoire: 'GRIMOIRE',
    home_brew: 'DEMLE',
    home_account: 'HESAP',
    home_recipes: 'TARİF',
    home_to: 'KALDI',
    home_max_rank: 'MAKSİMUM RÜTBE',

    // ─── Nav tabs ────────────────────────────────────────────────────────
    nav_grimor: 'GRİMOR',
    nav_inventory: 'ENVANTER',
    nav_character: 'KARAKTER',

    // ─── Settings ────────────────────────────────────────────────────────
    settings_title: 'AYARLAR',
    settings_back: '◄ GERİ',
    settings_account: 'GİRİŞ YAPILAN HESAP',
    settings_language: 'DİL',
    settings_danger: 'TEHLİKELİ BÖLGE',
    settings_delete: 'HESABI SİL',
    lang_english: 'İNGİLİZCE',
    lang_turkish: 'TÜRKÇE',

    // ─── Inventory ───────────────────────────────────────────────────────
    inventory_title: 'ENVANTER',
    inventory_empty: 'Henüz malzeme eklemedin',
    inventory_add: 'MALZEME EKLE',

    // ─── Character ───────────────────────────────────────────────────────
    character_title: 'KARAKTER',
  },
} as const;

export type StringKey = keyof typeof strings.en;
// Maps rank title (English key) to its string key
export const RANK_TITLE_KEY: Record<string, string> = {
  'APPRENTICE': 'rank_apprentice',
  'COOK': 'rank_cook',
  'CHEF': 'rank_chef',
  'SORCERER': 'rank_sorcerer',
  'ARCH-MAGE': 'rank_archmage',
};

export const RANK_FLAVOR_KEY: Record<string, string> = {
  'APPRENTICE': 'flavor_apprentice',
  'COOK': 'flavor_cook',
  'CHEF': 'flavor_chef',
  'SORCERER': 'flavor_sorcerer',
  'ARCH-MAGE': 'flavor_archmage',
};