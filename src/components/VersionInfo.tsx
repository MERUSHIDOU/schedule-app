import { useState } from 'react';
import { getFormattedBuildDate, getFormattedVersion } from '../utils/version';
import './VersionInfo.css';

export function VersionInfo() {
  const [showDetail, setShowDetail] = useState(false);

  const version = getFormattedVersion();
  const buildDate = getFormattedBuildDate();

  const handleToggle = () => {
    setShowDetail(prev => !prev);
  };

  return (
    <div className="version-info">
      <button
        type="button"
        className="version-badge"
        onClick={handleToggle}
        aria-label="バージョン情報を表示"
        aria-expanded={showDetail}
      >
        {version}
      </button>
      {showDetail && (
        <div className="version-detail" data-testid="version-detail">
          Build: {buildDate}
        </div>
      )}
    </div>
  );
}
