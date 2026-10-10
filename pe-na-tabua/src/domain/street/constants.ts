import { ROAD_HALF_WIDTH } from '../track/constants'

// Onde os pedestres esperam, na calçada (m a partir do centro).
export const SIDEWALK_X = ROAD_HALF_WIDTH + 1.4
export const WALK_SPEED: [number, number] = [1.3, 2.1] // m/s
export const WAIT_TIME: [number, number] = [3, 12] // s na calçada antes de atravessar de novo
export const RETRY_TIME = 0.4 // s até olhar de novo, quando vinha carro
export const CROSS_MARGIN = 1.5 // s a mais de folga ao olhar os carros
export const CAR_GAP = 2 // m entre o carro e o pedestre, na frente e atrás
export const RIDER_LOOK = 1.2 // s: não sai da calçada com moto chegando nesse tempo

// Distribuição na rua, por km, na densidade 1 (o desafio multiplica).
export const CROSSWALK_EVERY = 220 // m
export const PEDESTRIANS_PER_CROSSWALK = 1.6
export const JAYWALKERS_PER_KM = 2.5
export const POTHOLES_PER_KM = 10
export const ROADWORKS_PER_KM = 1.2
export const HAZARD_FREE_START = 160 // m: nada na largada
export const HAZARD_FREE_FINISH = 40 // m antes da chegada
export const STRAIGHT_CURVE = 0.003 // faixa de pedestres e obra só em trecho quase reto

// Obra: fileira de cones numa linha entre faixas.
export const ROADWORK_LENGTH: [number, number] = [36, 72] // m
export const CONE_SPACING = 4 // m
export const ROADWORK_LINES = [0, -3.25, 3.25] // m: centro e divisões entre faixas do mesmo sentido

export const POTHOLE_RADIUS: [number, number] = [0.45, 0.8] // m
export const POTHOLE_SPREAD = ROAD_HALF_WIDTH - 1 // m a partir do centro

// Acertos.
export const CONE_RADIUS = 0.25
export const CONE_SPEED_LOSS = 1.5 // m/s
export const POTHOLE_MIN_SPEED = 8 // m/s: devagar não sente
export const POTHOLE_SPEED_LOSS = 5 // m/s, na velocidade máxima
export const POTHOLE_JOLT = 2.2 // m/s de lado
export const PEDESTRIAN_RADIUS = 0.3
export const PEDESTRIAN_CRASH_SPEED = 25 // m/s (90 km/h): daqui para cima a moto cai junto
export const PEDESTRIAN_CRASH_DAMAGE = 15
export const PEDESTRIAN_SPEED_LOSS = 8 // m/s quando não cai
export const PEDESTRIAN_JOLT = 2.5 // m/s de lado
export const PEDESTRIAN_DOWN_TIME = 3 // s caído depois de pousar
export const PEDESTRIAN_ALERT_RANGE = 300 // m: policial nessa distância ouve o atropelamento
