import { Card, CardContent } from '@/components/ui/card'
import bg from '@/assets/images/background_main.jpeg'
import RegionMap from '@/components/RegionMap'
import { Toolbar } from '@/components/Toolbar'
import SignOutButton from '@/components/SignOutButton'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'



export default function SeekerMap() {
  const navigate = useNavigate()

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Card className="bg-white/80 backdrop-blur-md shadow-xl rounded-2xl max-w-5xl w-full h-full max-h-full flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-4 flex-1 min-h-0 p-0">
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 shadow-sm border-b">
            <Toolbar>
              <Button
                variant="yellow"
                onClick={() => navigate('/user/region')}
                aria-label="Home"
              >
                <Home />
              </Button>

              <Button
                variant="yellow"
                onClick={() => navigate('/user/account')}
              >
                My Account
              </Button>

              <Button
                variant="yellow"
                onClick={() =>
                  navigate('/user/account', {
                    state: { defaultTab: 'my-quests' },
                  })
                }
              >
                My Quests
              </Button>

              <Button variant="yellow" onClick={() => navigate('/user/leader')}>
                Leader Board
              </Button>

              <Button variant="yellow" onClick={() => navigate('/user/help')}>
                Help Guide
              </Button>

              <SignOutButton />
            </Toolbar>
          </div>
          <RegionMap className="mt-6 w-full max-w-xl mx-auto" />
        </CardContent>
      </Card>
    </div>
  )
}
