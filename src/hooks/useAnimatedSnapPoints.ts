import {
  runOnJS,
  type SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import type { BottomSheetProps } from '../components/bottomSheet';
import {
  INITIAL_CONTAINER_HEIGHT,
  INITIAL_HANDLE_HEIGHT,
  INITIAL_SNAP_POINT,
} from '../components/bottomSheet/constants';
import { normalizeSnapPoint } from '../utilities';

/**
 * Convert percentage snap points to pixels in screen and calculate
 * the accurate snap points positions.
 * @param snapPoints provided snap points.
 * @param containerHeight BottomSheetContainer height.
 * @param contentHeight content size.
 * @param handleHeight handle size.
 * @param footerHeight footer size.
 * @param enableDynamicSizing
 * @param maxDynamicContentSize
 * @returns {SharedValue<number[]>}
 */
export const useAnimatedSnapPoints = (
  snapPoints: BottomSheetProps['snapPoints'],
  containerHeight: SharedValue<number>,
  contentHeight: SharedValue<number>,
  handleHeight: SharedValue<number>,
  footerHeight: SharedValue<number>,
  enableDynamicSizing: BottomSheetProps['enableDynamicSizing'],
  maxDynamicContentSize: BottomSheetProps['maxDynamicContentSize'],
  onLog?: (msg: string) => void
): [SharedValue<number[]>, SharedValue<number>, SharedValue<boolean>] => {
  const dynamicSnapPointIndex = useSharedValue<number>(-1);
  const normalizedSnapPoints = useDerivedValue(() => {
    // early exit, if container layout is not ready
    const isContainerLayoutReady =
      containerHeight.value !== INITIAL_CONTAINER_HEIGHT;
    if (!isContainerLayoutReady) {
      onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints.normalizedSnapPoints container layout not ready`)
      return [INITIAL_SNAP_POINT];
    }

    // extract snap points from provided props
    const _snapPoints = snapPoints
      ? 'value' in snapPoints
        ? snapPoints.value
        : snapPoints
      : [];

    // normalized all provided snap points, converting percentage
    // values into absolute values.
    let _normalizedSnapPoints = _snapPoints.map(snapPoint =>
      normalizeSnapPoint(snapPoint, containerHeight.value)
    ) as number[];

    // return normalized snap points if dynamic sizing is not enabled
    if (!enableDynamicSizing) {
      onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints.normalizedSnapPoints no dynamic sizing, returning normalized ${_normalizedSnapPoints.map(x => x.toFixed(2)).join(', ')}`)
      return _normalizedSnapPoints;
    }

    // early exit, if handle height is not calculated yet.
    if (handleHeight.value === INITIAL_HANDLE_HEIGHT) {
      onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints.normalizedSnapPoints handle height not ready, returning initial snap point`)
      return [INITIAL_SNAP_POINT];
    }

    // early exit, if content height is not calculated yet.
    if (contentHeight.value === INITIAL_CONTAINER_HEIGHT) {
      onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints.normalizedSnapPoints content height not ready, returning initial snap point`)
      return [INITIAL_SNAP_POINT];
    }

    // calculate a new snap point based on content height.
    const dynamicSnapPoint =
      containerHeight.value -
      Math.min(
        contentHeight.value + handleHeight.value + footerHeight.value,
        maxDynamicContentSize !== undefined
          ? maxDynamicContentSize
          : containerHeight.value
      );

    // push dynamic snap point into the normalized snap points,
    // only if it does not exists in the provided list already.
    if (!_normalizedSnapPoints.includes(dynamicSnapPoint)) {
      _normalizedSnapPoints.push(dynamicSnapPoint);
    }

    // sort all snap points.
    _normalizedSnapPoints = _normalizedSnapPoints.sort((a, b) => b - a);

    // locate the dynamic snap point index.
    dynamicSnapPointIndex.value =
      _normalizedSnapPoints.indexOf(dynamicSnapPoint);

    onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints.normalizedSnapPoints dynamic snap point ${dynamicSnapPoint.toFixed(2)}, returning ${_normalizedSnapPoints.map(x => x.toFixed(2)).join(', ')}`)
    return _normalizedSnapPoints;
  }, [
    snapPoints,
    containerHeight,
    handleHeight,
    contentHeight,
    footerHeight,
    enableDynamicSizing,
    maxDynamicContentSize,
    dynamicSnapPointIndex,
  ]);

  const hasDynamicSnapPoint = useDerivedValue(() => {
    /**
     * if dynamic sizing is enabled, then we return true.
     */
    if (enableDynamicSizing) {
      return true;
    }

    // extract snap points from provided props
    const _snapPoints = snapPoints
      ? 'value' in snapPoints
        ? snapPoints.value
        : snapPoints
      : [];

    /**
     * if any of the snap points provided is a string, then we return true.
     */
    if (
      _snapPoints.length &&
      _snapPoints.find(snapPoint => typeof snapPoint === 'string')
    ) {
      return true;
    }

    return false;
  });

  onLog && runOnJS(onLog)(`${Date.now()} useAnimatedSnapPoints returns normalized ${normalizedSnapPoints.value.map(x => x.toFixed(2)).join(', ')}, dynamicSnapPointIndex ${dynamicSnapPointIndex.value}, hasDynamicSnapPoint ${hasDynamicSnapPoint.value}`);
  return [normalizedSnapPoints, dynamicSnapPointIndex, hasDynamicSnapPoint];
};
