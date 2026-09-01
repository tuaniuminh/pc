/**
 * PC Flex - In-App OTA Update Service
 * Tự động kiểm tra bản cập nhật mới trên GitHub Releases & Hỗ trợ 1-Click Update qua TrollStore
 */

import { addAppLog } from '../components/UI/DebugLogger';

const GITHUB_REPO = 'tuaniuminh/pc';
const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const UPDATE_CHECK_KEY = 'pcflex_last_update_check_time';

export const parseSemver = (versionStr) => {
  if (!versionStr) return [0, 0, 0];
  const cleaned = versionStr.replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
};

export const isNewerVersion = (currentVer, latestVer) => {
  const cur = parseSemver(currentVer);
  const lat = parseSemver(latestVer);

  for (let i = 0; i < 3; i++) {
    if (lat[i] > cur[i]) return true;
    if (lat[i] < cur[i]) return false;
  }
  return false;
};

export const checkForUpdate = async (currentAppVersion) => {
  try {
    addAppLog('info', `[Updater] Đang kiểm tra bản cập nhật mới từ GitHub Releases (Bản hiện tại: ${currentAppVersion})...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(GITHUB_LATEST_RELEASE_API, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GitHub API phản hồi mã lỗi ${response.status}`);
    }

    const release = await response.json();
    const tagName = release.tag_name || '';
    const latestVersion = tagName.replace(/^v/i, '');
    const releaseBody = release.body || 'Không có mô tả chi tiết.';
    const publishedAt = release.published_at ? new Date(release.published_at).toLocaleDateString('vi-VN') : '';
    const releaseUrl = release.html_url || `https://github.com/${GITHUB_REPO}/releases`;

    // Tìm file IPA trong danh sách assets đính kèm
    let ipaAsset = release.assets?.find(a => a.name.endsWith('.ipa'));
    let ipaDownloadUrl = ipaAsset?.browser_download_url || `https://github.com/${GITHUB_REPO}/releases/download/${tagName}/PCFlex-${tagName}.ipa`;

    const hasUpdate = isNewerVersion(currentAppVersion, latestVersion);

    const result = {
      hasUpdate,
      currentVersion: currentAppVersion,
      latestVersion,
      tagName,
      releaseName: release.name || `PC Flex ${tagName}`,
      body: releaseBody,
      publishedAt,
      ipaDownloadUrl,
      releaseUrl
    };

    if (hasUpdate) {
      addAppLog('success', `[Updater] ĐÃ PHÁT HIỆN BẢN MỚI: ${tagName} (Hiện tại: ${currentAppVersion})! Link IPA: ${ipaDownloadUrl}`);
    } else {
      addAppLog('info', `[Updater] Bạn đang sử dụng phiên bản mới nhất (${currentAppVersion}).`);
    }

    // Lưu mốc thời gian đã kiểm tra
    try {
      localStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());
    } catch (e) {}

    return result;
  } catch (error) {
    addAppLog('warn', `[Updater] Không thể kiểm tra cập nhật: ${error.message || error}`);
    return {
      hasUpdate: false,
      error: error.message || String(error)
    };
  }
};

/**
 * Mở trực tiếp link cài đặt qua TrollStore URL Scheme
 */
export const installViaTrollStore = (ipaDownloadUrl) => {
  if (!ipaDownloadUrl) return;

  addAppLog('info', `[Updater] Đang gọi TrollStore URL Scheme: ${ipaDownloadUrl}`);

  // URL Scheme chuẩn xác 100% của TrollStore 2
  const trollStoreUrl = `trollstore://install?url=${encodeURIComponent(ipaDownloadUrl)}`;

  try {
    window.location.href = trollStoreUrl;
  } catch (e) {
    addAppLog('warn', `[Updater] Không thể mở URL Scheme, chuyển sang tải trực tiếp`);
    window.open(ipaDownloadUrl, '_blank');
  }
};

/**
 * Tải trực tiếp file IPA qua Safari
 */
export const openDirectDownload = (ipaDownloadUrl) => {
  if (!ipaDownloadUrl) return;
  addAppLog('info', `[Updater] Mở link tải file IPA trên trình duyệt: ${ipaDownloadUrl}`);
  window.open(ipaDownloadUrl, '_blank');
};
