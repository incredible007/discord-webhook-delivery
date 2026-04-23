import { check } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

export const options: Options = {
    vus: 20,
    iterations: 100,
}

export default function (): void {
    const email = `user_${__VU}_${__ITER}@example.com`

    const res = http.post('http://localhost:3000/webhook/send', JSON.stringify({ email }), {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': __ENV.API_KEY,
        },
    })

    check(res, {
        'status is 202': (r) => r.status === 202,
    })
}
