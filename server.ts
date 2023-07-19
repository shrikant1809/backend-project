import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';

interface CourseOffering {
  course_id: string;
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
  status: string;
}
interface Registration {
  registration_id: string;
  email: string;
  course_name: string;
  course_id: string;
  status: string;
}
const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'qwerty1@',
  database: 'taskdb1',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

let courseOfferings: CourseOffering[] = [];
let registrations: Registration[] = [];

const COURSE_CANCELED = 'COURSE_CANCELED';

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
  // const course_id = `OFFERING-${course_name}-${instructor_name}`;
  const course_id = `OFFERING-${course_name}-${instructor_name}`;

  const newCourseOffering: CourseOffering = {
    course_id,
    course_name,
    instructor_name,
    start_date,
    min_employees,
    max_employees,
    status: '',
  };

  const query =
    'INSERT INTO course_offering (course_id, course_name, instructor_name, start_date, min_employees, max_employees) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(
    query,
    [
      course_id,
      course_name,
      instructor_name,
      start_date,
      min_employees,
      max_employees,
    ],
    (err, result) => {
      if (err) {
        console.error('Error adding course offering:', err);
        return res.status(500).json({
          status: 500,
          message: 'DATABASE_ERROR',
          data: {
            failure: {
              message: 'Failed to add course offering',
            },
          },
        });
      }

      console.log('Course offering added successfully');

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
    }
  );
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
    (offering) => offering.course_id === course_id
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

  if (
    registrations.filter((reg) => reg.course_id === course_id).length <
    courseOffering.min_employees
  ) {
    // Set the status of the course offering to 'COURSE_CANCELED'
    courseOffering.status = COURSE_CANCELED;
    console.log('Course offering canceled due to insufficient registrations');
  }
  if (
    registrations.filter((reg) => reg.course_id === course_id).length >=
    courseOffering.max_employees
  ) {
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
  const registration_id = `${employee_name}-${course_id}`;
  const newRegistration: Registration = {
    registration_id,
    email,
    course_name: courseOffering.course_name,
    course_id,
    status: 'ACCEPTED',
  };

  // const query = 'SELECT * FROM taskdb1.registration';
  const query =
    'INSERT INTO registrations (registration_id, email, course_name, course_id, status) VALUES (?, ?, ?, ?, ?)';

  // connection.query(query, newRegistration, (err, result) => {
  connection.query(
    query,
    [registration_id, email, courseOffering.course_name, course_id, 'ACCEPTED'],
    (err, result) => {
      if (err) {
        console.error('Error adding registration:', err);
        return res.status(500).json({
          status: 500,
          message: 'DATABASE_ERROR',
          data: {
            failure: {
              message: 'Failed to add registration',
            },
          },
        });
      }

      console.log('Registration added successfully');

      registrations.push(newRegistration);

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
    }
  );
});

app.post('/allot/:course_id', (req: Request, res: Response) => {
  const { course_id } = req.params;

  const courseOffering = courseOfferings.find(
    (offering) => offering.course_id === course_id
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

  const query = 'SELECT * FROM taskdb1.registrations';
  connection.query(query, [course_id], (err, rows) => {
    if (err) {
      console.error('Error retrieving registrations:', err);
      return res.status(500).json({
        status: 500,
        message: 'DATABASE_ERROR',
        data: {
          failure: {
            message: 'Failed to retrieve registrations',
          },
        },
      });
    }

    console.log('Registrations retrieved successfully');

    const allottedRegistrations = rows;

    return res.status(200).json({
      status: 200,
      message: 'successfully allotted course to registered employees',
      data: {
        success: allottedRegistrations,
      },
    });
  });
});

app.post('/cancel/:registration_id', (req: Request, res: Response) => {
  const { registration_id } = req.params;

  const query = 'DELETE FROM registrations WHERE registration_id = ?';
  connection.query(query, [registration_id], (err, result) => {
    if (err) {
      console.error('Error cancelling registration:', err);
      return res.status(500).json({
        status: 500,
        message: 'DATABASE_ERROR',
        data: {
          failure: {
            message: 'Failed to cancel registration',
          },
        },
      });
    }

    console.log('Registration cancelled successfully');

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
});

process.on('SIGINT', () => {
  connection.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    } else {
      console.log('MySQL connection closed');
      process.exit();
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the API ');
});

app.listen(8000, () => {
  console.log('Server running on port 8000');
});
