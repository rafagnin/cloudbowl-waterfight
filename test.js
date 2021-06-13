const app = require('./web');
const supertest = require('supertest')
const request = supertest(app)

beforeAll(() => {
    process.env.NODE_ENV = 'test';
})

describe('Throw Tests', () => {
    it('throw north', async () => {
        const res = await request.post('/').send({
            "test": "throw north",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "N"},
                    "https://A_PLAYERS_URL": { "x": 2, "y": 1},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("T");
    });
    it('throw south', async () => {
        const res = await request.post('/').send({
            "test": "throw south",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [5,4], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "S"},
                    "https://A_PLAYERS_URL": { "x": 2, "y": 3, "direction": "S"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("T");
    });
    it('throw west', async () => {
        const res = await request.post('/').send({
            "test": "throw west",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "W"},
                    "https://A_PLAYERS_URL": { "x": 1, "y": 2, "direction": "W"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("T");
    });
    it('throw east', async () => {
        const res = await request.post('/').send({
            "test": "throw east",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "E"},
                    "https://A_PLAYERS_URL": { "x": 3, "y": 2, "direction": "E"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("T");
    });
    it('dont throw north', async () => {
        const res = await request.post('/').send({
            "test": "dont throw north",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 1, "y": 1, "direction": "N"},
                    "https://A_PLAYERS_URL": { "x": 2, "y": 1, "direction": "N"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).not.toBe("T");
    });
    it('throw east 2', async () => {
        const res = await request.post('/').send({
            "test": "throw east 2",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [9,6], // width, height
                "state": {
                    "https://MY_URL": { "x": 1, "y": 1, "direction": "E"},
                    "https://A_PLAYERS_URL": { "x": 3, "y": 1, "direction": "E"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("T");
    });
});

describe('Move Tests', () => {
    it('move forward', async () => {
        const res = await request.post('/').send({
            "test": "move forward",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "N"},
                    "https://A_PLAYERS_URL": { "x": 4, "y": 3, "direction": "N"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).not.toBe("T");
    });
    it('move left', async () => {
        const res = await request.post('/').send({
            "test": "move left",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "S"},
                    "https://A_PLAYERS_URL": { "x": 4, "y": 3, "direction": "S"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).not.toBe("T");
    });
    it('move right', async () => {
        const res = await request.post('/').send({
            "test": "move right",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [4,3], // width, height
                "state": {
                    "https://MY_URL": { "x": 2, "y": 2, "direction": "W"},
                    "https://A_PLAYERS_URL": { "x": 4, "y": 3, "direction": "W"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).not.toBe("T");
    });
    it('move forward 2', async () => {
        const res = await request.post('/').send({
            "test": "move right",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [6,5], // width, height
                "state": {
                    "https://MY_URL": { "x": 1, "y": 2, "direction": "E"},
                    "https://A_PLAYERS_URL": { "x": 5, "y": 2, "direction": "E"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("F");
    });
    it('move forward 3', async () => {
        const res = await request.post('/').send({
            "test": "move right",
            "_links": { "self": { "href": "https://MY_URL" } },
            "arena": { 
                "dims": [9,6], // width, height
                "state": {
                    "https://MY_URL": { "x": 4, "y": 3, "direction": "W"},
                    "https://A_PLAYERS_URL": { "x": 0, "y": 3, "direction": "N"},
                }
            }
        });

        expect(res.status).toBe(200);
        expect(res.text).toBe("F");
    });
});