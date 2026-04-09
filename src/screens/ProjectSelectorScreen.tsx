import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, Platform } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { LogOut, ArrowRight, Building, Settings, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ALL_PROJECTS = [
    {
        id: 'LOMAS_DEL_MAR',
        title: 'Lomas del Mar',
        subtitle: 'Postventa & Gestión',
        status: 'active',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi1Ps5yYYrXkEf3P0EYvNCxvLpYxUHconsF15DF9_pWthyQgCiKnmjHlGjJ3iV6TYwzhh-9dWWkLum1geMMGtvhtmpeejSJJbi-UiWxCQ11dsihV6riZADCOMz6oYaLgiIQhQ0UUiF6pdKI9GjWryBNXoT3yBuSGiqnaRTmzPBOFERBdK5pdUFHMGK7uDHzcM405ODhJ_gOlEqHueJ_NkM8AXhJaI_nCfOxn_wxRT_cQ_zSCwg1EC4c4fpOacDhPejP1izp7B7kQPX',
        theme: { primary: '#a8cdd4', secondary: '#edc062' }
    },
    {
        id: 'ARENA_Y_SOL',
        title: 'Arena y Sol',
        subtitle: 'Administración Global',
        status: 'pending',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMnereTlFQz73rf1ssaUBPqch7zLN3cEDYT4dF04UpwpyuwbY6CIkXzzdYzq4-LmF7AO0wHVaB_a_iCPnZQeH2z7oT3pM04HGKVxviTDht2_cMof9KYRzSE708io1cBpQO05tm7kWZ39DZkXWIs1PffXNaf-uPvsSse9kuxwXVE-AHybfUpzODF6SDYk_29Eg-bQcmixpDfVUK1NpLvM9kM38XTt5TCxu7j1XGYlHDgIsLB4ltTd2CuWhLlU9iBHp6CeRpSda4Cppd',
         theme: { primary: '#ffe4a0', secondary: '#d4b7a8' }
    },
    {
        id: 'LIBERTAD_Y_ALEGRIA',
        title: 'Libertad y Alegría',
        subtitle: 'Gestión Residencial',
        status: 'pending',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBsx8TKlTmN78jKIMdO-InU-aJA8Fp95-Dlw3o7n1G9Fmk_VeMwAa2TxoL1DuR4z0Y85FEk0hhwqHv9enXaC8qETnzGYPwrKkMAgLA-ScPnRhKQaYKsEQqKyhn5-_IfOKE7XkAsF2Dm8tHT-5l477AQyXA2okTyQbnFW5O7FSILnTFArLBr4CJ4vT0klcZuXO8q6Lv3cI4cQBp8yED62cv3yy0jonid6o10Eanu1ruubyy9jFaKR-KO0Qx8Qa_ZNSuzrfQauNuAtXJ',
        theme: { primary: '#b3d4a8', secondary: '#a8bacdd' }
    }
];

const ProjectSelectorScreen = () => {
    const { user, setActiveProject, signOut } = useAuth();
    
    // Filtramos los proyectos a los que el usuario tiene acceso
    const availableProjects = ALL_PROJECTS.filter(p => user?.assignedProjects?.includes(p.id));

    const handleSelectProject = (project: typeof ALL_PROJECTS[0]) => {
        if (project.status === 'pending') {
            Alert.alert(
                'Proyecto en Configuración', 
                `La integración con la base de datos de ${project.title} aún está en proceso de configuración. Pronto estará disponible.`,
                [{ text: 'Entendido', style: 'default' }]
            );
            return;
        }

        // Si es Lomas del Mar, continuar.
        setActiveProject(project.id);
    };

    return (
        <View className="flex-1 bg-[#0f1115]">
            <View className="absolute inset-0 bg-[#0f1115]">
                <View className="absolute -top-[20%] -left-[10%] w-[80%] h-[60%] rounded-full bg-[#1e2a2d]/40 blur-3xl" />
                <View className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[40%] rounded-full bg-[#36595f]/20 blur-3xl" />
            </View>

            <View 
                className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 h-24"
                style={{ paddingTop: Platform.OS === 'ios' ? 40 : 20 }}
            >
                <View>
                     <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Portal Directivo</Text>
                </View>
                <TouchableOpacity 
                    onPress={signOut}
                    className="flex-row items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10"
                >
                    <LogOut color="#ffb4ab" size={14} />
                    <Text className="text-error font-bold text-[10px] uppercase tracking-widest">Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingTop: 100, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6 mx-auto w-full max-w-md flex-1">
                    <View className="mb-10 mt-6 items-center">
                        <View className="w-16 h-16 bg-white/5 rounded-full items-center justify-center mb-6 border border-white/10">
                            <Building color="#edc062" size={28} />
                        </View>
                        <Text className="font-display font-black text-3xl tracking-tight text-on-surface mb-2 text-center">
                            ¡Bienvenida, {user?.name.split(' ')[0]}!
                        </Text>
                        <Text className="text-on-surface-variant text-center max-w-[280px]">
                            Seleccione el proyecto inmobiliario que desea administrar en esta sesión.
                        </Text>
                    </View>

                    <View className="gap-6 mt-4">
                        {availableProjects.length === 0 ? (
                             <View className="items-center p-8 bg-white/5 border border-dashed border-white/20 rounded-[32px]">
                                 <Text className="text-on-surface-variant font-bold text-center">No tienes proyectos asignados.</Text>
                             </View>
                        ) : (
                            availableProjects.map((project) => (
                                <TouchableOpacity 
                                    key={project.id}
                                    onPress={() => handleSelectProject(project)}
                                    activeOpacity={0.8}
                                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
                                >
                                    <ImageBackground 
                                        source={{ uri: project.image }}
                                        className="w-full h-44 rounded-[32px] overflow-hidden"
                                        resizeMode="cover"
                                    >
                                        <LinearGradient 
                                            colors={['transparent', 'rgba(0,0,0,0.85)', '#0f1115']} 
                                            locations={[0, 0.4, 1]}
                                            className="absolute inset-0"
                                        />
                                        
                                        <View className="flex-1 p-6 justify-between">
                                            {/* Top badges */}
                                            <View className="flex-row justify-end">
                                                {project.status === 'active' ? (
                                                    <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30 flex-row items-center gap-1.5">
                                                        <Sparkles color="#2db395" size={10} />
                                                        <Text className="text-emerald-400 font-black text-[8px] uppercase tracking-widest">Activo</Text>
                                                    </View>
                                                ) : (
                                                    <View className="bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30 flex-row items-center gap-1.5">
                                                        <Settings color="#edc062" size={10} />
                                                        <Text className="text-amber-400 font-black text-[8px] uppercase tracking-widest">En Configuración</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Bottom content */}
                                            <View className="flex-row items-end justify-between">
                                                <View>
                                                    <Text className="font-display font-black text-2xl tracking-tighter text-white uppercase">{project.title}</Text>
                                                    <Text className="text-white/60 text-[10px] uppercase tracking-[2px] font-bold mt-1" style={{ color: project.theme.primary }}>
                                                        {project.subtitle}
                                                    </Text>
                                                </View>
                                                <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20 backdrop-blur-md">
                                                    <ArrowRight color="white" size={18} />
                                                </View>
                                            </View>
                                        </View>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default ProjectSelectorScreen;
