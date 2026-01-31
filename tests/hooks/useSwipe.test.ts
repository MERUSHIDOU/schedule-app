import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useSwipe } from '../../src/hooks/useSwipe';

describe('useSwipe', () => {
  // テスト用のTouchEventをシミュレート
  const createTouchEvent = (
    type: 'touchstart' | 'touchmove' | 'touchend',
    clientX: number,
    clientY: number,
    timeStamp: number = Date.now()
  ): TouchEvent => {
    const touch = {
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      pageX: clientX,
      pageY: clientY,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
    } as Touch;

    const event = new TouchEvent(type, {
      touches: type === 'touchend' ? [] : [touch],
      targetTouches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperty(event, 'timeStamp', {
      value: timeStamp,
      writable: false,
    });

    return event;
  };

  describe('右スワイプ検出', () => {
    it('しきい値を超える右スワイプでonSwipeRightが呼ばれる', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe(onSwipeLeft, onSwipeRight, {
          threshold: 50,
          velocityThreshold: 0.3,
        })
      );

      // タッチ開始: x=100, y=200
      const startEvent = createTouchEvent('touchstart', 100, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ移動: x=200（水平+100）, y=210（垂直+10）
      const moveEvent = createTouchEvent('touchmove', 200, 210, 1100);
      result.current.onTouchMove(moveEvent);

      // タッチ終了: x=200, y=210
      const endEvent = createTouchEvent('touchend', 200, 210, 1200);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('左スワイプ検出', () => {
    it('しきい値を超える左スワイプでonSwipeLeftが呼ばれる', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe(onSwipeLeft, onSwipeRight, {
          threshold: 50,
          velocityThreshold: 0.3,
        })
      );

      // タッチ開始: x=200, y=200
      const startEvent = createTouchEvent('touchstart', 200, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ移動: x=100（水平-100）, y=210（垂直+10）
      const moveEvent = createTouchEvent('touchmove', 100, 210, 1100);
      result.current.onTouchMove(moveEvent);

      // タッチ終了: x=100, y=210
      const endEvent = createTouchEvent('touchend', 100, 210, 1200);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('しきい値チェック', () => {
    it('移動距離がしきい値未満の場合はコールバックが呼ばれない', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe(onSwipeLeft, onSwipeRight, {
          threshold: 50,
          velocityThreshold: 0.3,
        })
      );

      // タッチ開始: x=100, y=200
      const startEvent = createTouchEvent('touchstart', 100, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ終了: x=130（+30px、しきい値50px未満）, y=200
      const endEvent = createTouchEvent('touchend', 130, 200, 1100);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('垂直移動の優先度', () => {
    it('垂直移動が優位な場合はコールバックが呼ばれない', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe(onSwipeLeft, onSwipeRight, {
          threshold: 50,
          velocityThreshold: 0.3,
        })
      );

      // タッチ開始: x=100, y=100
      const startEvent = createTouchEvent('touchstart', 100, 100, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ移動: x=160（水平+60）, y=200（垂直+100）
      // 垂直移動が大きい
      const moveEvent = createTouchEvent('touchmove', 160, 200, 1100);
      result.current.onTouchMove(moveEvent);

      // タッチ終了: x=160, y=200
      const endEvent = createTouchEvent('touchend', 160, 200, 1200);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('速度チェック', () => {
    it('速度が不十分な場合はコールバックが呼ばれない', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe(onSwipeLeft, onSwipeRight, {
          threshold: 50,
          velocityThreshold: 0.3,
        })
      );

      // タッチ開始: x=100, y=200
      const startEvent = createTouchEvent('touchstart', 100, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ終了: x=200（+100px）, y=200
      // 時間が長すぎる（1000ms）ため速度が遅い: 100px / 1000ms = 0.1px/ms < 0.3px/ms
      const endEvent = createTouchEvent('touchend', 200, 200, 2000);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('デフォルトオプション', () => {
    it('オプションを指定しない場合はデフォルト値が使用される', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe(undefined, onSwipeRight));

      // デフォルト: threshold=50, velocityThreshold=0.3

      // タッチ開始: x=100, y=200
      const startEvent = createTouchEvent('touchstart', 100, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ終了: x=200（+100px）, y=210（+10px）
      // 時間: 200ms → 速度 100/200 = 0.5px/ms > 0.3px/ms
      const endEvent = createTouchEvent('touchend', 200, 210, 1200);
      result.current.onTouchEnd(endEvent);

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('touchesが空の場合は何もしない', () => {
      const onSwipeRight = vi.fn();
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe(onSwipeLeft, onSwipeRight));

      const emptyTouchEvent = new TouchEvent('touchstart', {
        touches: [],
        targetTouches: [],
        changedTouches: [],
        bubbles: true,
        cancelable: true,
      });

      result.current.onTouchStart(emptyTouchEvent);
      result.current.onTouchEnd(emptyTouchEvent);

      expect(onSwipeRight).not.toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('コールバックが未定義でもエラーにならない', () => {
      const { result } = renderHook(() => useSwipe());

      // タッチ開始: x=100, y=200
      const startEvent = createTouchEvent('touchstart', 100, 200, 1000);
      result.current.onTouchStart(startEvent);

      // タッチ終了: x=200, y=210
      const endEvent = createTouchEvent('touchend', 200, 210, 1200);

      expect(() => {
        result.current.onTouchEnd(endEvent);
      }).not.toThrow();
    });
  });
});
