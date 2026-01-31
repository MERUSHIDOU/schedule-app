import { useCallback, useRef } from 'react';

export interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  preventDefaultOnSwipe?: boolean;
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

/**
 * スワイプジェスチャーを検出するカスタムフック
 *
 * @param onSwipeLeft - 左スワイプ時のコールバック
 * @param onSwipeRight - 右スワイプ時のコールバック
 * @param options - スワイプ判定のオプション
 * @returns タッチイベントハンドラ
 */
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options: SwipeOptions = {}
): SwipeHandlers {
  const { threshold = 50, velocityThreshold = 0.3, preventDefaultOnSwipe = false } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchMove = useRef<TouchPosition | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: e.timeStamp,
    };
    touchMove.current = null;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0 || !touchStart.current) return;

    const touch = e.touches[0];
    touchMove.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: e.timeStamp,
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const endPosition: TouchPosition = touchMove.current || {
        x: e.changedTouches[0]?.clientX || touchStart.current.x,
        y: e.changedTouches[0]?.clientY || touchStart.current.y,
        time: e.timeStamp,
      };

      // 移動距離を計算
      const deltaX = endPosition.x - touchStart.current.x;
      const deltaY = endPosition.y - touchStart.current.y;

      // 移動時間を計算
      const deltaTime = endPosition.time - touchStart.current.time;

      // 速度を計算（px/ms）
      const velocity = Math.abs(deltaX) / deltaTime;

      // 水平移動が垂直移動の1.5倍以上の場合のみスワイプとして扱う
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      // 最小移動距離と最小速度の両方を満たす
      const meetsThreshold = Math.abs(deltaX) >= threshold;
      const meetsVelocity = velocity >= velocityThreshold;

      // すべての条件を満たした場合のみスワイプを発火
      if (isHorizontalSwipe && meetsThreshold && meetsVelocity) {
        if (preventDefaultOnSwipe) {
          e.preventDefault();
        }

        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      // リセット
      touchStart.current = null;
      touchMove.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold, velocityThreshold, preventDefaultOnSwipe]
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
