import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-green-600">
              AgriBuddy
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/marketplace" className="text-gray-700 hover:text-gray-900">
                Marketplace
              </Link>
              <Link href="/community" className="text-gray-700 hover:text-gray-900">
                Community
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <span className="mr-4">Welcome, {user.name}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
