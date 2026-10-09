import { createRng } from '../random'
import { buildCenterline } from './centerline'
import { buildSegments } from './build-segments'
import { courseSections } from './course-sections'
import { RUNOFF_LENGTH, SEGMENT_LENGTH } from './constants'
import { scatterProps } from './scatter-props'
import type { Course, Track } from './types'

export function createTrack(course: Course): Track {
  const segments = buildSegments(courseSections(course))
  const length = segments.length * SEGMENT_LENGTH
  return {
    name: course.name,
    theme: course.theme,
    scenery: course.scenery,
    segments,
    points: buildCenterline(segments),
    props: scatterProps(segments, createRng(course.seed), course.scenery),
    length,
    finishS: length - RUNOFF_LENGTH,
  }
}
