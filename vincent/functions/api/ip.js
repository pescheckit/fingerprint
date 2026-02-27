// GET /api/ip - Return visitor's public IP
export async function onRequestGet(context) {
  const { request } = context

  const ip = request.headers.get('CF-Connecting-IP') || ''
  const country = request.headers.get('CF-IPCountry') || ''
  const city = request.headers.get('CF-IPCity') || ''
  const region = request.headers.get('CF-Region') || ''
  const asn = request.headers.get('CF-IPAsn') || ''
  const asOrg = request.headers.get('CF-IPAsOrganization') || ''

  return Response.json({
    ip,
    country,
    city,
    region,
    asn,
    asOrg,
    isIPv6: ip.includes(':'),
  })
}
