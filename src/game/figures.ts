export type Point = {x: number, y: number};
export type Shape = [Point, Point, Point, Point][];
export type Row = number[];
export type Cells = Row[];

interface IFigureProps {
  x: number;
  y: number;
  o: number;
  shape: Shape;
  color: number;
  points: number;
};

export class Figure {
  private _x: number;
  private _y: number;
  private _o: number;
  private _shape: Shape;
  private _color: number;
  private _points: number;

  constructor({ x, y, o, shape, color, points }: Partial<IFigureProps>) {
    this._x = x ?? 0;
    this._y = y ?? 0;
    this._o = o ?? 0;
    this._shape = shape ?? [];
    this._color = color ?? 0;
    this._points = points ?? 0;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get o() {
    return this._o;
  }

  get points() {
    return this._points;
  }

  getWidth() {
    return this._shape[this._o].reduce( (p, {x}) => x > p ? x : p, -4 ) -
      this._shape[this._o].reduce( (p, {x}) => x < p ? x : p, 4) + 1;
  }

  getHeight() {
    return this._shape[this._o].reduce( (p, {y}) => y > p ? y : p, -4 ) -
      this._shape[this._o].reduce( (p, {y}) => y < p ? y : p, 4) + 1;
  }

  nextO() {
    return this._o < this._shape.length - 1 ? this._o + 1 : 0;
  }

  canMove(dx: number, dy: number, nextO: boolean, cells: Cells) {
    return this.projectShape(dx, dy, nextO).every( (c) =>
      c.y >= 0 && c.y < cells.length &&
      c.x >= 0 && c.x < cells[c.y].length &&
      !cells[c.y][c.x]);
  }

  projectShape(dx = 0, dy = 0, nextO = false): Point[] {
    if (!this._shape.length) {
      return [];
    } else {
      return this._shape[nextO ? this.nextO() : this._o].map(p => ({x: p.x + this._x + dx, y: p.y + this._y + dy}));
    }
  }

  merge(cells: Cells): Cells {
    const projectedShape = this.projectShape();
    let topLeftX = 1000000;
    let topLeftY = 1000000;
    let bottomRightX = -1;
    let bottomRightY = -1;
    for (const p of projectedShape) {
      if (topLeftX > p.x) topLeftX = p.x;
      if (topLeftY > p.y) topLeftY = p.y;
      if (bottomRightX < p.x) bottomRightX = p.x;
      if (bottomRightY < p.y) bottomRightY = p.y;
    }
    return cells.map( (r, y) => (y < topLeftY || y > bottomRightY)
      ? r
      : r.map( (c, x) =>
        (x < topLeftX || x > bottomRightX || !projectedShape.find( e => e.x === x && e.y === y )) ? c : this._color
      )
    );
  }

  setXY(x: number, y: number) {
    return new Figure({
      x,
      y,
      o: this._o,
      shape: this._shape,
      color: this._color,
      points: this._points
    });
  }

  move(dx: number, dy = 0, turn = false) {
    return new Figure({
      x: this.x + dx,
      y: this.y + dy,
      o: turn ? this.nextO() : this.o,
      shape: this._shape,
      color: this._color,
      points: this._points
    });
  }

  center(w: number, h: number) {
    return this.setXY(
      (w - this.getWidth()) / 2 >> 0,
      (h - this.getHeight()) / 2 >> 0
    );
  }
};

type Shapes = {
  shape: Shape;
  color: number;
  points: number;
}[];

const shapes: Shapes = [
  // square
  {
    shape: [[
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 0, y: 1},
      {x: 1, y: 1}
    ]],
    color: 1,
    points: 2
  },

  // bar
  {
    shape: [
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 3, y: 0}
      ],
      [
        {x: 2, y: -1},
        {x: 2, y: 0},
        {x: 2, y: 1},
        {x: 2, y: 2}
      ],
      [
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 3, y: 0},
        {x: 4, y: 0}
      ],
      [
        {x: 2, y: -2},
        {x: 2, y: -1},
        {x: 2, y: 0},
        {x: 2, y: 1}
      ]
    ],
    color: 3,
    points: 4
  },

  // tshape
  {
    shape: [
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 1, y: 1}
      ],
      [
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 0}
      ],
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 1, y: -1}
      ],
      [
        {x: 0, y: 0},
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1}
      ]
    ],
    color: 2,
    points: 6,
  },

  // lshape
  {
    shape: [
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 0, y: 1}
      ],
      [
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 1}
      ],
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 2, y: -1}
      ],
      [
        {x: 0, y: -1},
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1}
      ]
    ],
    color: 4,
    points: 8
  },

  // gshape
  {
    shape: [
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 2, y: 1}
      ],
      [
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: -1}
      ],
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 0, y: -1}
      ],
      [
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 0, y: 1}
      ]
    ],
    color: 5,
    points: 8
  },

  // sshape
  {
    shape: [
      [
        {x: 0, y: 1},
        {x: 1, y: 1},
        {x: 1, y: 0},
        {x: 2, y: 0}
      ],
      [
        {x: 1, y: 0},
        {x: 2, y: 0},
        {x: 1, y: -1},
        {x: 2, y: 1}
      ],
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 1, y: -1},
        {x: 2, y: -1}
      ],
      [
        {x: 0, y: -1},
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 1, y: 1}
      ]
    ],
    color: 6,
    points: 10
  },

  // zshape
  {
    shape: [
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 1}
      ],
      [
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 0},
        {x: 2, y: -1}
      ],
      [
        {x: 0, y: -1},
        {x: 1, y: -1},
        {x: 1, y: 0},
        {x: 2, y: 0}
      ],
      [
        {x: 0, y: 0},
        {x: 0, y: 1},
        {x: 1, y: 0},
        {x: 1, y: -1}
      ]
    ],
    color: 7,
    points: 10
  }
];

export const getRandomFigure = (w: number, h: number) => new Figure(shapes[Math.floor(Math.random() * shapes.length)]).center(w, h);
