import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './index'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector = useSelector.withTypes<RootState>()
