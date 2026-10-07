import { createRng } from '../random'
import { buildCenterline } from './centerline'
import { buildSegments } from './build-segments'
import { RUNOFF_LENGTH, SEGMENT_LENGTH } from './constants'
import { scatterProps } from './scatter-props'
import type { Course, Track } from './types'

export function createTrack(course: Course): Track {
  const segments = buildSegments(course.sections)
  const length = segments.length * SEGMENT_LENGTH
  return {
    segments,
    points: buildCenterline(segments),
    props: scatterProps(segments, createRng(course.seed)),
    length,
    finishS: length - RUNOFF_LENGTH,
  }
}
