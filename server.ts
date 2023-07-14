import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

interface CourseOffering {
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
}

let courseOfferings: CourseOffering[] = [];

app.post('/add/courseOffering', (req: Request, res: Response) => {
  const {
    course_name,
    instructor_name,
    start_date,
    min_employees,
    max_employees,
  } = req.body;

  if (
    !course_name ||
    !instructor_name ||
    !start_date ||
    !min_employees ||
    !max_employees
  ) {
    return res.status(400).json({
      status: 400,
      message: 'INPUT_DATA_ERROR',
      data: {
        failure: {
          message:
            'course_name, instructor_name, start_date, min_employees, max_employees cannot be empty',
        },
      },
    });
  }

  const course_id = `OFFERING-${course_name}-${instructor_name}`;

  const newCourseOffering: CourseOffering = {
    course_name,
    instructor_name,
    start_date,
    min_employees,
    max_employees,
  };

  courseOfferings.push(newCourseOffering);

  return res.status(200).json({
    status: 200,
    message: 'course added successfully',
    data: {
      success: {
        course_id,
      },
    },
  });
});

app.post('/add/register/:course_id', (req: Request, res: Response) => {
  const { employee_name, email } = req.body;
  const { course_id } = req.params;

  if (!employee_name || !email || !course_id) {
    return res.status(400).json({
      status: 400,
      message: 'INPUT_DATA_ERROR',
      data: {
        failure: {
          message: 'employee_name, email, course_id cannot be empty',
        },
      },
    });
  }

  const courseOffering = courseOfferings.find(
    (offering) => offering.course_name === course_id
  );

  if (!courseOffering) {
    return res.status(400).json({
      status: 400,
      message: 'COURSE_NOT_FOUND',
      data: {
        failure: {
          message: 'Course not found',
        },
      },
    });
  }

  if (courseOffering.max_employees <= courseOffering.min_employees) {
    return res.status(400).json({
      status: 400,
      message: 'COURSE_FULL_ERROR',
      data: {
        failure: {
          message: 'Cannot register for course, course is full',
        },
      },
    });
  }

  return res.status(200).json({
    status: 200,
    message: `successfully registered for ${course_id}`,
    data: {
      success: {
        registration_id: `${employee_name}-${course_id}`,
        status: 'ACCEPTED',
      },
    },
  });
});

app.post('/allot/:course_id', (req: Request, res: Response) => {
  const { course_id } = req.params;

  const courseOffering = courseOfferings.find(
    (offering) => offering.course_name === course_id
  );

  if (!courseOffering) {
    return res.status(400).json({
      status: 400,
      message: 'COURSE_NOT_FOUND',
      data: {
        failure: {
          message: 'Course not found',
        },
      },
    });
  }

  return res.status(200).json({
    status: 200,
    message: 'successfully allotted course to registered employees',
    data: {
      success: [],
    },
  });
});

app.post('/cancel/:registration_id', (req: Request, res: Response) => {
  const { registration_id } = req.params;

  return res.status(200).json({
    status: 200,
    message: `successfully cancelled registration for ${registration_id}`,
    data: {
      success: {
        registration_id,
        course_id: 'course id',
        status: 'CANCEL_ACCEPTED',
      },
    },
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the API ');
});

app.listen(8000, () => {
  console.log('Server running on port 8000');
});
