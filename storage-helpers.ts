
// ===== YENİ TEMİZ COIN MANAGEMENT SİSTEMİ =====

// ✅ YENİ ANAHTAR SİSTEMİ İLE KULLANICI EMAIL ALMA
export const getCurrentUserEmail = (): string => {
  try {
    // Önce yeni anahtar sistemini kontrol et
    const newUser = localStorage.getItem('pc_current_user');
    if (newUser) {
      const user = JSON.parse(newUser);
      return (user.email || '').trim().toLowerCase();
    }
    
    // Eski sistem için fallback
    const oldUser = localStorage.getItem('currentUser');
    if (oldUser) {
      const user = JSON.parse(oldUser);
      return (user.email || '').trim().toLowerCase();
    }
    
    return '';
  } catch {
    return '';
  }
};

// JSON okuma/yazma - GÜVENLİ HALE GETİRİLDİ
export const readJSON = (key: string, defaultValue: any = {}) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed = JSON.parse(data);
    return parsed !== null ? parsed : defaultValue;
  } catch (error) {
    console.error(`JSON okuma hatası (${key}):`, error);
    return defaultValue;
  }
};

export const writeJSON = (key: string, value: any) => {
  try {
    if (value === null || value === undefined) {
      console.warn(`Null/undefined değer yazılmaya çalışıldı: ${key}`);
      return false;
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`JSON yazma hatası (${key}):`, error);
    return false;
  }
};

// ✅ GÜVENLİ SAYI DÖNÜŞTÜRME FONKSİYONU
const safeNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};

// ✅ GÜNCEL COİN FİYATLARINI ALMA - LANSMAN VERİLERİNDEN GERÇEK FİYATLAR
export const getCurrentCoinPrices = (): Record<string, number> => {
  const basePrices: Record<string, number> = {
    'USDT': 1,
    'BTC': 45000,
    'ETH': 2800,
    'BNB': 320,
    'ADA': 0.45,
    'DOT': 12.5
  };

  // Admin lansmanlarından güncel fiyatları al
  try {
    const savedLaunches = localStorage.getItem('adminLaunches');
    if (savedLaunches) {
      const launches = JSON.parse(savedLaunches);
      if (Array.isArray(launches)) {
        launches.forEach((launch: any) => {
          if (launch?.symbol && launch?.price) {
            const cleanPrice = String(launch.price)
              .replace(/[$,\s]/g, '')
              .trim();
            const priceNum = safeNumber(cleanPrice, 0);
            if (priceNum > 0) {
              basePrices[launch.symbol.toUpperCase()] = priceNum;
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Lansman fiyatları alınırken hata:', error);
  }

  return basePrices;
};

// ✅ YENİ ANAHTAR SİSTEMİ İLE KULLANICI BAKİYE ALMA - GÜVENLİ
export const getUserBalance = (email?: string) => {
  const userEmail = email || getCurrentUserEmail();
  if (!userEmail) return { coins: {}, transactions: [], stakings: [], investments: [] };
  
  try {
    // Önce yeni anahtar sistemini kontrol et
    const newBalances = readJSON('pc_balances_v2', {});
    if (newBalances[userEmail]) {
      // Güvenlik kontrolü
      const balance = newBalances[userEmail];
      return {
        coins: balance.coins || {},
        transactions: Array.isArray(balance.transactions) ? balance.transactions : [],
        stakings: Array.isArray(balance.stakings) ? balance.stakings : [],
        investments: Array.isArray(balance.investments) ? balance.investments : [],
        wallet_usdt: safeNumber(balance.wallet_usdt, 0)
      };
    }
    
    // Eski sistem için fallback
    const oldBalances = readJSON('userBalances', {});
    const oldBalance = oldBalances[userEmail] || {};
    return {
      coins: oldBalance.coins || {},
      transactions: Array.isArray(oldBalance.transactions) ? oldBalance.transactions : [],
      stakings: Array.isArray(oldBalance.stakings) ? oldBalance.stakings : [],
      investments: Array.isArray(oldBalance.investments) ? oldBalance.investments : [],
      wallet_usdt: safeNumber(oldBalance.wallet_usdt, 0)
    };
  } catch (error) {
    console.error('getUserBalance hatası:', error);
    return { coins: {}, transactions: [], stakings: [], investments: [] };
  }
};

// ✅ YENİ ANAHTAR SİSTEMİ İLE KULLANICI BAKİYE KAYDETME - GÜVENLİ
export const saveUserBalance = (balance: any, email?: string) => {
  const userEmail = email || getCurrentUserEmail();
  if (!userEmail) {
    console.error('Kullanıcı email bulunamadı');
    return false;
  }
  
  try {
    // Güvenlik kontrolleri
    const safeBalance = {
      coins: balance.coins || {},
      transactions: Array.isArray(balance.transactions) ? balance.transactions : [],
      stakings: Array.isArray(balance.stakings) ? balance.stakings : [],
      investments: Array.isArray(balance.investments) ? balance.investments : [],
      wallet_usdt: safeNumber(balance.wallet_usdt, 0)
    };
    
    // Coin değerlerini güvenli hale getir
    Object.keys(safeBalance.coins).forEach(symbol => {
      safeBalance.coins[symbol] = safeNumber(safeBalance.coins[symbol], 0);
    });
    
    // Öncelikle yeni anahtar sistemine kaydet
    const newBalances = readJSON('pc_balances_v2', {});
    newBalances[userEmail] = safeBalance;
    writeJSON('pc_balances_v2', newBalances);
    
    // Eski sistem için de kaydet (geriye uyumluluk)
    const oldBalances = readJSON('userBalances', {});
    oldBalances[userEmail] = safeBalance;
    writeJSON('userBalances', oldBalances);
    
    return true;
  } catch (error) {
    console.error('Bakiye kaydetme hatası:', error);
    return false;
  }
};

// ✨ YENİ: COİN FİYAT GÜNCELLEMESİ VE OTOMATIK KAZANÇ/KAYIP HESAPLAMA - TAMAMEN GÜVENLİ
export const updateCoinPriceAndCalculateProfits = (
  coinSymbol: string, 
  oldPrice: number, 
  newPrice: number
): { 
  affectedUsers: number, 
  totalProfitLoss: number, 
  userUpdates: any[] 
} => {
  try {
    console.log(`🎯 FİYAT DEĞİŞİMİ: ${coinSymbol} ${oldPrice} → ${newPrice}`);
    
    // GÜVENLİK KONTROLLERI
    if (!coinSymbol || typeof coinSymbol !== 'string') {
      console.error('❌ Geçersiz coinSymbol:', coinSymbol);
      return { affectedUsers: 0, totalProfitLoss: 0, userUpdates: [] };
    }
    
    const safeOldPrice = safeNumber(oldPrice, 0);
    const safeNewPrice = safeNumber(newPrice, 0);
    
    if (safeOldPrice <= 0 || safeNewPrice <= 0) {
      console.error('❌ Geçersiz fiyat değerleri:', { oldPrice: safeOldPrice, newPrice: safeNewPrice });
      return { affectedUsers: 0, totalProfitLoss: 0, userUpdates: [] };
    }
    
    const cleanSymbol = coinSymbol.trim().toUpperCase();
    const priceChange = safeNewPrice - safeOldPrice;
    const changePercentage = (priceChange / safeOldPrice) * 100;
    
    // Çok küçük değişimleri yoksay
    if (Math.abs(changePercentage) < 0.01) {
      console.log('Fiyat değişimi çok küçük, işlem yapılmıyor');
      return { affectedUsers: 0, totalProfitLoss: 0, userUpdates: [] };
    }
    
    // Kullanıcı verilerini güvenli şekilde al
    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    const allUsers = new Set([...Object.keys(newBalances), ...Object.keys(oldBalances)]);
    
    let affectedUsers = 0;
    let totalProfitLoss = 0;
    const userUpdates: any[] = [];
    
    // Her kullanıcı için işlem yap
    allUsers.forEach(userEmail => {
      try {
        if (!userEmail || typeof userEmail !== 'string') return;
        
        const newUserBalance = newBalances[userEmail] || { coins: {}, transactions: [] };
        const oldUserBalance = oldBalances[userEmail] || { coins: {}, transactions: [] };
        
        // Coin miktarını kontrol et - GÜVENLİ
        const coinAmount = safeNumber(
          newUserBalance.coins?.[cleanSymbol] || oldUserBalance.coins?.[cleanSymbol] || 0,
          0
        );
        
        if (coinAmount <= 0) {
          return; // Bu kullanıcıda bu coin yok
        }
        
        // SADECE İSTATİSTİK HESAPLA - BAKİYE DEĞİŞTİRME
        const profitLoss = coinAmount * priceChange;
        
        if (!isFinite(profitLoss)) {
          console.error('❌ Geçersiz profitLoss:', { coinAmount, priceChange, profitLoss });
          return;
        }
        
        affectedUsers++;
        totalProfitLoss += profitLoss;
        
        const currentUSDT = safeNumber(
          newUserBalance.coins?.USDT || oldUserBalance.coins?.USDT || 0,
          0
        );
        
        userUpdates.push({
          email: userEmail,
          coinAmount: coinAmount,
          profitLoss: profitLoss,
          oldUSDT: currentUSDT,
          newUSDT: currentUSDT, // Değişmiyor, sadece gösterim için
          currentUSDT: currentUSDT
        });
        
        console.log(`👤 ${userEmail}: ${coinAmount} ${cleanSymbol} → ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(4)} USD portföy etkisi`);
        
      } catch (userError) {
        console.error(`❌ Kullanıcı ${userEmail} işlem hatası:`, userError);
      }
    });
    
    // Sadece fiyat geçmişini kaydet
    if (affectedUsers > 0) {
      try {
        const priceHistory = readJSON('priceHistory', []);
        priceHistory.unshift({
          id: Date.now().toString(),
          coinSymbol: cleanSymbol,
          oldPrice: safeOldPrice,
          newPrice: safeNewPrice,
          changePercentage: changePercentage,
          affectedUsers: affectedUsers,
          totalProfitLoss: totalProfitLoss,
          timestamp: new Date().toISOString(),
          isInfoOnly: true
        });
        
        // Son 100 kayıt tut
        if (priceHistory.length > 100) {
          priceHistory.splice(100);
        }
        
        writeJSON('priceHistory', priceHistory);
        
      } catch (historyError) {
        console.error('❌ Fiyat geçmişi kaydetme hatası:', historyError);
      }
    }
    
    console.log(`✅ Fiyat değişimi hesaplandı: ${affectedUsers} kullanıcı, ${totalProfitLoss.toFixed(2)} USD portföy etkisi`);
    
    return {
      affectedUsers,
      totalProfitLoss,
      userUpdates
    };
    
  } catch (error) {
    console.error('❌ Fiyat değişimi hesaplama hatası:', error);
    return { affectedUsers: 0, totalProfitLoss: 0, userUpdates: [] };
  }
};

// ===== DEPOSIT REQUEST FONKSİYONU =====
export const createDepositRequest = (method: string, amount: number): boolean => {
  try {
    const email = getCurrentUserEmail();
    if (!email) {
      console.error('Kullanıcı girişi yapılmamış');
      return false;
    }

    const safeAmount = safeNumber(amount, 0);
    if (safeAmount <= 0) {
      console.error('Geçersiz tutar');
      return false;
    }

    const pendingDeposits = readJSON('pendingDeposits', []);
    
    const newRequest = {
      id: Date.now().toString(),
      userEmail: email,
      method: method,
      amount: safeAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestDate: new Date().toLocaleDateString('tr-TR')
    };

    pendingDeposits.push(newRequest);
    writeJSON('pendingDeposits', pendingDeposits);

    console.log('✅ Deposit request created:', newRequest);
    return true;

  } catch (error) {
    console.error('createDepositRequest error:', error);
    return false;
  }
};

// ===== ✅ DÜZELTME: COIN BALANCE GÜNCELLEME - YALNIZCA DOĞRU MİKTARLARI KAYDET =====
export const updateCoinBalance = (symbol: string, amount: number, operation: 'add' | 'subtract' = 'add') => {
  try {
    const balance = getUserBalance();
    
    // Coins objesi kontrolü
    if (!balance.coins || typeof balance.coins !== 'object') {
      balance.coins = {};
    }
    
    const targetSymbol = symbol.trim().toUpperCase();
    const safeAmount = safeNumber(amount, 0);
    
    console.log(`🎯 updateCoinBalance: ${targetSymbol} ${operation} ${safeAmount}`);
    
    // Güvenlik kontrolleri
    if (safeAmount < 0) {
      console.error('Negatif amount:', safeAmount);
      return false;
    }
    
    // Mevcut bakiye
    const currentAmount = safeNumber(balance.coins[targetSymbol], 0);
    
    // Yeni bakiye hesaplama
    let newAmount;
    if (operation === 'add') {
      newAmount = currentAmount + safeAmount;
    } else {
      newAmount = Math.max(0, currentAmount - safeAmount);
    }
    
    // Güvenlik kontrolü
    if (!isFinite(newAmount) || newAmount < 0) {
      console.error('Geçersiz newAmount:', newAmount);
      return false;
    }
    
    balance.coins[targetSymbol] = newAmount;
    
    console.log(`✅ ${targetSymbol} güncellendi: ${currentAmount} → ${newAmount}`);
    
    return saveUserBalance(balance);
    
  } catch (error) {
    console.error('updateCoinBalance hatası:', error);
    return false;
  }
};

// Transaction ekleme - GÜVENLİ
export const addTransaction = (transactionData: any) => {
  try {
    const balance = getUserBalance();
    
    if (!Array.isArray(balance.transactions)) {
      balance.transactions = [];
    }
    
    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'completed',
      amount: safeNumber(transactionData.amount, 0),
      ...transactionData
    };
    
    balance.transactions.unshift(transaction);
    
    return saveUserBalance(balance);
  } catch (error) {
    console.error('Transaction ekleme hatası:', error);
    return false;
  }
};

// ===== ✅ TAMAMEN YENİ COIN ALMA FONKSİYONU - KÖKTEN ÇÖZÜM =====
export const buyCoin = (launch: any, usdAmount: number): boolean => {
  try {
    const email = getCurrentUserEmail();
    if (!email) {
      alert('Lütfen giriş yapın');
      return false;
    }
    
    // Launch verisi kontrolü
    if (!launch?.symbol || !launch?.name || !launch?.price) {
      console.error('❌ Launch verisi eksik:', launch);
      alert('Launch verisi eksik - sembol, isim veya fiyat eksik');
      return false;
    }

    const SYM = launch.symbol.trim().toUpperCase();
    const safeUsdAmount = safeNumber(usdAmount, 0);
    
    // Fiyat parsing - güvenli yöntem
    let pricePerToken = 0;
    
    if (launch.price) {
      const priceStr = String(launch.price)
        .replace(/\$/g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, '')
        .trim();
      
      pricePerToken = safeNumber(priceStr, 0);
    }
    
    console.log(`🔍 FİYAT ANALİZİ: "${launch.price}" → ${pricePerToken}`);
    
    // Değer kontrolleri
    if (safeUsdAmount <= 0 || pricePerToken <= 0) {
      alert(`Geçersiz değerler:
      - Yatırım: ${safeUsdAmount} USD
      - Token Fiyatı: ${pricePerToken} USD
      - Orijinal: "${launch.price}"`);
      return false;
    }

    // Kullanıcı bakiyesi kontrolü
    const balance = getUserBalance();
    const currentUSDT = safeNumber(balance.coins?.USDT, 0);
    
    if (currentUSDT < safeUsdAmount) {
      alert(`Yetersiz USDT bakiyesi:
      - Mevcut: ${currentUSDT.toFixed(2)} USDT
      - Gerekli: ${safeUsdAmount.toFixed(2)} USDT`);
      return false;
    }
    
    // Token miktarı hesaplama
    const tokenAmount = safeUsdAmount / pricePerToken;
    
    if (tokenAmount <= 0) {
      alert('Token miktarı hesaplama hatası');
      return false;
    }
    
    console.log(`🎯 İŞLEM: ${safeUsdAmount} USD → ${tokenAmount} ${SYM} (${pricePerToken} USD/token)`);
    
    // ✅ YENİ YAKLAŞIM: DOĞRUDAN BALANCE GÜNCELLEMESİ
    try {
      // USDT düş
      if (!balance.coins) balance.coins = {};
      balance.coins.USDT = Math.max(0, currentUSDT - safeUsdAmount);
      
      // Hedef coin ekle
      const currentTokenAmount = safeNumber(balance.coins[SYM], 0);
      balance.coins[SYM] = currentTokenAmount + tokenAmount;
      
      // Transaction ekle
      if (!Array.isArray(balance.transactions)) {
        balance.transactions = [];
      }
      
      const transaction = {
        id: Date.now().toString(),
        type: 'token_purchase',
        symbol: SYM,
        tokenAmount: tokenAmount,
        usdAmount: safeUsdAmount,
        pricePerToken: pricePerToken,
        description: `${launch.name} (${SYM}) satın alımı`,
        launchName: launch.name,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      balance.transactions.unshift(transaction);
      
      // ✅ BAKİYEYİ KAYDET
      const saveSuccess = saveUserBalance(balance);
      
      if (!saveSuccess) {
        throw new Error('Bakiye kaydedilemedi');
      }
      
      console.log(`✅ İŞLEM TAMAMLANDI: ${tokenAmount} ${SYM} alındı`);
      console.log(`💰 Yeni ${SYM} bakiye: ${balance.coins[SYM]}`);
      console.log(`💵 Yeni USDT bakiye: ${balance.coins.USDT}`);
      
      return true;
      
    } catch (saveError) {
      console.error('❌ Bakiye kaydetme hatası:', saveError);
      alert('Bakiye güncellenirken hata oluştu');
      return false;
    }
    
  } catch (error) {
    console.error('❌ buyCoin fonksiyonu hatası:', error);
    alert('İşlem sırasında beklenmeyen hata oluştu');
    return false;
  }
};

// ===== ADMIN PARA EKLEME/ÇIKARMA - GÜVENLİ =====
export const adminUpdateBalance = (userEmail: string, coinSymbol: string, amount: number, operation: 'add' | 'subtract', note: string = '') => {
  try {
    if (!userEmail || !coinSymbol) {
      throw new Error('Email veya coin sembolü eksik');
    }
    
    const safeAmount = safeNumber(amount, 0);
    if (safeAmount <= 0) {
      throw new Error('Geçersiz miktar');
    }
    
    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    const targetEmail = userEmail.trim().toLowerCase();
    
    if (!newBalances[targetEmail]) {
      newBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    if (!oldBalances[targetEmail]) {
      oldBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    
    const newUserBalance = newBalances[targetEmail];
    const oldUserBalance = oldBalances[targetEmail];
    const cleanSymbol = coinSymbol.trim().toUpperCase();
    
    // Coins objesi güvenli kontrolü
    if (!newUserBalance.coins) newUserBalance.coins = {};
    if (!oldUserBalance.coins) oldUserBalance.coins = {};
    
    const currentAmount = safeNumber(newUserBalance.coins[cleanSymbol] || oldUserBalance.coins[cleanSymbol], 0);
    
    let newAmount;
    let transactionType;
    let description;
    
    if (operation === 'add') {
      newAmount = currentAmount + safeAmount;
      transactionType = 'admin_deposit';
      description = `Admin tarafından ${cleanSymbol} eklendi`;
    } else {
      if (currentAmount < safeAmount) {
        throw new Error(`Yetersiz ${cleanSymbol} bakiyesi (Mevcut: ${currentAmount}, İstenen: ${safeAmount})`);
      }
      newAmount = currentAmount - safeAmount;
      transactionType = 'admin_withdrawal';
      description = `Admin tarafından ${cleanSymbol} düşüldü`;
    }
    
    if (note) description += ` - ${note}`;
    
    // Güvenlik kontrolü
    if (!isFinite(newAmount) || newAmount < 0) {
      throw new Error('Geçersiz yeni bakiye');
    }
    
    // Bakiye güncelle
    newUserBalance.coins[cleanSymbol] = newAmount;
    oldUserBalance.coins[cleanSymbol] = newAmount;
    
    // Transaction ekle
    const transaction = {
      id: Date.now().toString(),
      type: transactionType,
      symbol: cleanSymbol,
      amount: safeAmount,
      date: new Date().toISOString(),
      status: 'completed',
      description: description,
      adminAction: true
    };
    
    if (!Array.isArray(newUserBalance.transactions)) newUserBalance.transactions = [];
    if (!Array.isArray(oldUserBalance.transactions)) oldUserBalance.transactions = [];
    
    newUserBalance.transactions.unshift(transaction);
    oldUserBalance.transactions.unshift(transaction);
    
    // Kaydet
    writeJSON('pc_balances_v2', newBalances);
    writeJSON('userBalances', oldBalances);
    
    console.log(`✅ Admin ${operation} tamamlandı: ${safeAmount} ${cleanSymbol} → ${targetEmail}`);
    return true;
    
  } catch (error) {
    console.error('Admin balance update error:', error);
    throw error;
  }
};

// ===== DEPOSIT İŞLEM FONKSİYONU - GÜVENLİ =====
export const approveDepositAndUpdateWallet = (userEmail: string, amount: number, note: string = '') => {
  try {
    if (!userEmail) {
      throw new Error('Email eksik');
    }
    
    const safeAmount = safeNumber(amount, 0);
    if (safeAmount <= 0) {
      throw new Error('Geçersiz miktar');
    }
    
    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    const targetEmail = userEmail.trim().toLowerCase();
    
    if (!newBalances[targetEmail]) {
      newBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    if (!oldBalances[targetEmail]) {
      oldBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    
    const newUserBalance = newBalances[targetEmail];
    const oldUserBalance = oldBalances[targetEmail];
    
    // Coins objesi güvenli kontrolü
    if (!newUserBalance.coins) newUserBalance.coins = {};
    if (!oldUserBalance.coins) oldUserBalance.coins = {};
    
    const currentUSDT = safeNumber(newUserBalance.coins?.USDT || oldUserBalance.coins?.USDT, 0);
    const currentWalletUSDT = safeNumber(newUserBalance.wallet_usdt || oldUserBalance.wallet_usdt, 0);
    
    const newUSDTAmount = currentUSDT + safeAmount;
    const newWalletAmount = currentWalletUSDT + safeAmount;
    
    // Güvenlik kontrolü
    if (!isFinite(newUSDTAmount) || !isFinite(newWalletAmount)) {
      throw new Error('Geçersiz yeni bakiye hesaplaması');
    }
    
    // USDT coin bakiyesi güncelle
    newUserBalance.coins.USDT = newUSDTAmount;
    oldUserBalance.coins.USDT = newUSDTAmount;
    
    // Cüzdan bakiyesi güncelle
    newUserBalance.wallet_usdt = newWalletAmount;
    oldUserBalance.wallet_usdt = newWalletAmount;
    
    // Transaction ekle
    const transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      symbol: 'USDT',
      amount: safeAmount,
      date: new Date().toISOString(),
      status: 'completed',
      description: `Admin onayı: ${note}`,
      adminAction: true
    };
    
    if (!Array.isArray(newUserBalance.transactions)) newUserBalance.transactions = [];
    if (!Array.isArray(oldUserBalance.transactions)) oldUserBalance.transactions = [];
    
    newUserBalance.transactions.unshift(transaction);
    oldUserBalance.transactions.unshift(transaction);
    
    // Kaydet
    writeJSON('pc_balances_v2', newBalances);
    writeJSON('userBalances', oldBalances);
    
    console.log(`✅ Deposit onaylandı: ${safeAmount} USDT → ${targetEmail}`);
    return true;
    
  } catch (error) {
    console.error('Deposit approval error:', error);
    throw error;
  }
};

// ✅ YENİ: KULLANICI VERİLERİNİ SIFIRLAMA FONKSİYONU
export const resetUserData = () => {
  try {
    const email = getCurrentUserEmail();
    if (!email) {
      console.error('Kullanıcı girişi yapılmamış');
      return false;
    }

    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    
    delete newBalances[email];
    delete oldBalances[email];
    
    writeJSON('pc_balances_v2', newBalances);
    writeJSON('userBalances', oldBalances);
    
    console.log(`✅ Kullanıcı verileri sıfırlandı: ${email}`);
    return true;
    
  } catch (error) {
    console.error('Veri sıfırlama hatası:', error);
    return false;
  }
};

// ✅ YENİ: ÇEKİM ONAYLANDIKTAN SONRA BİLGİ FİŞİ EKLEME FONKSİYONU
export const addWithdrawalCompletionTransaction = (userEmail: string, amount: number, walletAddress: string) => {
  try {
    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    const targetEmail = userEmail.trim().toLowerCase();
    
    if (!newBalances[targetEmail]) {
      newBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    if (!oldBalances[targetEmail]) {
      oldBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    
    const newUserBalance = newBalances[targetEmail];
    const oldUserBalance = oldBalances[targetEmail];
    
    // ✅ YENİ BİLGİ FİŞİ TRANSACTİON'I OLUŞTUR
    const completionTransaction = {
      id: Date.now().toString(),
      type: 'withdrawal_completed',
      symbol: 'USDT',
      amount: amount,
      description: `Çekim tamamlandı (${walletAddress.substring(0, 10)}...)`,
      date: new Date().toISOString(),
      status: 'completed',
      walletAddress: walletAddress,
      approvedAt: new Date().toISOString(),
      approvedBy: 'admin',
      pendingWithdrawal: false,
      completedWithdrawal: true,
      isInformationOnly: true // ✅ Bu sadece bilgi fişi
    };
    
    // Transaction arrays kontrolü
    if (!Array.isArray(newUserBalance.transactions)) newUserBalance.transactions = [];
    if (!Array.isArray(oldUserBalance.transactions)) oldUserBalance.transactions = [];
    
    // ✅ YENİ TRANSACTION'I EN BAŞA EKLE
    newUserBalance.transactions.unshift(completionTransaction);
    oldUserBalance.transactions.unshift(completionTransaction);
    
    // Kaydet
    writeJSON('pc_balances_v2', newBalances);
    writeJSON('userBalances', oldBalances);
    
    console.log('✅ Çekim tamamlandı bilgi fişi eklendi:', completionTransaction);
    return true;
    
  } catch (error) {
    console.error('Çekim tamamlandı bilgi fişi ekleme hatası:', error);
    return false;
  }
};

// ===== ✅ ÇEKİM REDDEDİLDİĞİNDE BAKİYE İADE ETME FONKSİYONU =====
export const processWithdrawalRejection = (userEmail: string, amount: number, transactionId: string, walletAddress: string) => {
  try {
    console.log(`🔄 Çekim reddetme işlemi başlıyor: ${userEmail}, ${amount} USDT, TxID: ${transactionId}`);
    
    const newBalances = readJSON('pc_balances_v2', {});
    const oldBalances = readJSON('userBalances', {});
    const targetEmail = userEmail.trim().toLowerCase();
    
    if (!newBalances[targetEmail]) {
      newBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    if (!oldBalances[targetEmail]) {
      oldBalances[targetEmail] = { coins: {}, transactions: [], stakings: [], investments: [], wallet_usdt: 0 };
    }
    
    const newUserBalance = newBalances[targetEmail];
    const oldUserBalance = oldBalances[targetEmail];
    
    // Coins objesi güvenli kontrolü
    if (!newUserBalance.coins) newUserBalance.coins = {};
    if (!oldUserBalance.coins) oldUserBalance.coins = {};
    
    // Transaction arrays kontrolü
    if (!Array.isArray(newUserBalance.transactions)) newUserBalance.transactions = [];
    if (!Array.isArray(oldUserBalance.transactions)) oldUserBalance.transactions = [];
    
    // ✅ 1. BAKİYEYİ İADE ET
    const currentUSDT = safeNumber(newUserBalance.coins.USDT || oldUserBalance.coins.USDT, 0);
    const newUSDTAmount = currentUSDT + amount;
    
    newUserBalance.coins.USDT = newUSDTAmount;
    oldUserBalance.coins.USDT = newUSDTAmount;
    
    console.log(`✅ Bakiye iade edildi: ${currentUSDT} → ${newUSDTAmount} USDT`);
    
    // ✅ 2. BEKLEYEN ÇEKİM TRANSACTION'INI KALDIR
    newUserBalance.transactions = newUserBalance.transactions.filter((t: any) => 
      !(t.id === transactionId && t.type === 'withdrawal_pending')
    );
    oldUserBalance.transactions = oldUserBalance.transactions.filter((t: any) => 
      !(t.id === transactionId && t.type === 'withdrawal_pending')
    );
    
    console.log(`✅ Bekleyen çekim transaction'ı kaldırıldı: ${transactionId}`);
    
    // ✅ 3. REDDEDİLEN ÇEKİM TRANSACTION'I EKLE
    const rejectedTransaction = {
      id: Date.now().toString(),
      type: 'withdrawal_rejected',
      symbol: 'USDT',
      amount: amount,
      description: `Çekim talebi reddedildi - bakiye iade edildi (${walletAddress.substring(0, 10)}...)`,
      date: new Date().toISOString(),
      status: 'rejected',
      walletAddress: walletAddress,
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin',
      pendingWithdrawal: false,
      rejectedWithdrawal: true,
      originalTransactionId: transactionId // Orijinal transaction ID'yi sakla
    };
    
    newUserBalance.transactions.unshift(rejectedTransaction);
    oldUserBalance.transactions.unshift(rejectedTransaction);
    
    console.log(`✅ Reddedilen çekim transaction'ı eklendi:`, rejectedTransaction);
    
    // ✅ 4. KAYDET
    writeJSON('pc_balances_v2', newBalances);
    writeJSON('userBalances', oldBalances);
    
    console.log(`✅ Çekim reddetme işlemi tamamlandı: ${userEmail}, ${amount} USDT iade edildi`);
    return true;
    
  } catch (error) {
    console.error('❌ Çekim reddetme işlemi hatası:', error);
    return false;
  }
};

// Backward compatibility
export const readJSON_old = readJSON;
export const writeJSON_old = writeJSON;
export const curEmail = getCurrentUserEmail;
export const processInvestment = (launch: any, amount: any) => {
  const success = buyCoin(launch, safeNumber(amount, 0));
  if (success) {
    setTimeout(() => {
      location.href = '/dashboard';
    }, 1000);
  }
};
export const selfHealHoldings = () => {
  // Artık hiçbir şey yapmıyor
};
