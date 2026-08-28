'use strict';

const WeChat = {
  isWechat() {
    return typeof wx !== 'undefined';
  },
  share(title) {
    title = title || '我在地牢探险者中探索到了第' + (game ? game.dungeonLevel : 1) + '层！';
    if (typeof wx !== 'undefined' && wx.shareAppMessage) {
      wx.shareAppMessage({ title, imageUrl: '' });
    } else if (navigator.share) {
      navigator.share({ title, text: title, url: location.href }).catch(() => {});
    } else {
      prompt('📤 复制链接分享给好友：', location.href);
    }
  },
  showRewardedAd(onReward) {
    if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
      const ad = wx.createRewardedVideoAd({ adUnitId: 'adunit-xxxx' });
      ad.show().catch(() => ad.load().then(() => ad.show()));
      ad.onClose(res => {
        if (res && res.isEnded) {
          if (onReward) onReward();
        } else {
          showToast('⚠️ 请完整观看广告');
        }
      });
    } else {
      if (confirm('📺 模拟激励视频广告\n点击「确定」观看完成获得奖励')) {
        if (onReward) onReward();
      }
    }
  }
};

function shareGame() {
  WeChat.share();
}

function showRewardedAd(callback) {
  WeChat.showRewardedAd(callback);
}

function adRewardGold() {
  showRewardedAd(() => {
    if (!game) return;
    game.player.gold += 50;
    updateHUD();
    saveGame();
    showToast('💰 获得 50 金币！');
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WeChat, shareGame, showRewardedAd, adRewardGold };
}