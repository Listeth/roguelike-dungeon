// =========================================================
// init.js
// 存储层初始化脚本：在页面加载时执行，确保版本号存在
// =========================================================
(function () {
  'use strict';
  const CURRENT_VERSION = 1;

  if (StorageManager.getSchemaVersion() === null) {
    StorageManager.setSchemaVersion(CURRENT_VERSION);
  }

  const version = StorageManager.getSchemaVersion();
  if (version > CURRENT_VERSION) {
    console.warn(`存档版本 ${version} 高于当前支持版本 ${CURRENT_VERSION}，可能无法正确读取`);
  }
})();