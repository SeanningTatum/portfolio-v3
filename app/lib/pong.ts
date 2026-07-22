/**
 * Self-playing pong for the CRT screen. Field is normalized (x, y ∈ 0..1);
 * both paddles are simple chase-the-ball AIs with capped speed, so rallies
 * end naturally when the ball out-angles a paddle. Pure + deterministic —
 * no rng, see `__tests__/pong.test.ts`.
 */

export interface PongState {
  ballX: number;
  ballY: number;
  /** Field-widths per second. */
  vx: number;
  vy: number;
  /** Paddle centers (y). */
  leftY: number;
  rightY: number;
  scoreL: number;
  scoreR: number;
}

export const PADDLE_H = 0.24;
export const PADDLE_SPEED = 0.42; // slower than the ball can angle — misses happen
const BALL_SPEED_X = 0.55;
const SERVE_VY = 0.32;

export function initPong(): PongState {
  return {
    ballX: 0.5,
    ballY: 0.5,
    vx: BALL_SPEED_X,
    vy: SERVE_VY,
    leftY: 0.5,
    rightY: 0.5,
    scoreL: 0,
    scoreR: 0,
  };
}

function chase(paddleY: number, ballY: number, dt: number): number {
  const maxStep = PADDLE_SPEED * dt;
  const delta = Math.min(Math.abs(ballY - paddleY), maxStep);
  const y = paddleY + Math.sign(ballY - paddleY) * delta;
  return Math.min(1 - PADDLE_H / 2, Math.max(PADDLE_H / 2, y));
}

/** Serve toward the player who just conceded; vy sign alternates per point. */
function serve(s: PongState, towardLeft: boolean): PongState {
  const points = s.scoreL + s.scoreR;
  return {
    ...s,
    ballX: 0.5,
    ballY: 0.5,
    vx: towardLeft ? -BALL_SPEED_X : BALL_SPEED_X,
    vy: points % 2 === 0 ? SERVE_VY : -SERVE_VY,
  };
}

export function stepPong(s: PongState, dt: number): PongState {
  let { ballX, ballY, vx, vy } = s;
  ballX += vx * dt;
  ballY += vy * dt;

  // Walls.
  if (ballY < 0) {
    ballY = -ballY;
    vy = Math.abs(vy);
  } else if (ballY > 1) {
    ballY = 2 - ballY;
    vy = -Math.abs(vy);
  }

  const leftY = chase(s.leftY, ballY, dt);
  const rightY = chase(s.rightY, ballY, dt);

  // Paddle faces (x = 0.04 / 0.96). Hit offset steers vy — rallies evolve.
  const steer = (paddleY: number) => ((ballY - paddleY) / (PADDLE_H / 2)) * 0.5;
  if (ballX < 0.04 && vx < 0) {
    if (Math.abs(ballY - leftY) <= PADDLE_H / 2) {
      ballX = 0.08 - ballX;
      vx = Math.abs(vx);
      vy = steer(leftY);
    } else if (ballX < -0.02) {
      return serve({ ...s, leftY, rightY, scoreR: s.scoreR + 1 }, true);
    }
  } else if (ballX > 0.96 && vx > 0) {
    if (Math.abs(ballY - rightY) <= PADDLE_H / 2) {
      ballX = 1.92 - ballX;
      vx = -Math.abs(vx);
      vy = steer(rightY);
    } else if (ballX > 1.02) {
      return serve({ ...s, leftY, rightY, scoreL: s.scoreL + 1 }, false);
    }
  }

  return { ...s, ballX, ballY, vx, vy, leftY, rightY };
}
